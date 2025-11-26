import os
import json
import logging
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from dotenv import load_dotenv

import motor.motor_asyncio
import redis.asyncio as aioredis
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from bson import ObjectId

# ---------------- CONFIG ----------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("marketing-backend")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DBNAME = os.getenv("MONGO_DBNAME", "bunnyStore_database")

REDIS_URL = os.getenv("REDIS_URL", "")
USE_REDIS = bool(REDIS_URL)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")  # Fallback nếu không có employee admin

CRON_HOUR = int(os.getenv("CRON_HOUR", 2))
STATIC_PERCENTILE = int(os.getenv("STATIC_PERCENTILE", 60))
VIEW_THRESHOLD_FOR_REMARK = int(os.getenv("VIEW_THRESHOLD_FOR_REMARK", 3))
DELAY_MINUTES_AFTER_THRESHOLD = int(os.getenv("DELAY_MINUTES_AFTER_THRESHOLD", 30))

# ---------------- MongoDB ----------------
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = mongo_client[MONGO_DBNAME]

# Create TTL index for remarksScheduled collection (auto-delete after expiration)
async def init_mongodb_indexes():
    await db.remarksScheduled.create_index("expiresAt", expireAfterSeconds=0)
    logger.info("MongoDB TTL indexes initialized")

# ---------------- Redis ----------------
redis_client = None
if USE_REDIS:
    redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
    logger.info("Using Redis at %s", REDIS_URL)
else:
    logger.info("Redis not configured; dynamic counters disabled")

# ---------------- FastAPI + Scheduler ----------------
app = FastAPI(title="Marketing Automation (MongoDB Schema Updated)")
scheduler = AsyncIOScheduler()
scheduler.start()

@app.on_event("startup")
async def startup_event():
    await init_mongodb_indexes()

# ---------------- Models ----------------
class UserEvent(BaseModel):
    user_id: str
    product_id: str
    action: str  # "view", "add_to_cart", "remove_from_cart", "purchase"
    ts: Optional[datetime] = None

# ---------------- Utilities ----------------
async def send_email(to: str, subject: str, body: str):
    msg = EmailMessage()
    msg["From"] = EMAIL_FROM
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(msg)
        logger.info("Email sent to %s", to)
    except Exception as e:
        logger.exception("Failed to send email: %s", e)

async def get_admin_emails():
    """Lấy danh sách email của tất cả admin từ collection employees"""
    admins = await db.employees.find(
        {"role": "admin", "isActive": True},  # Chỉ admin và đang active
        {"email": 1}
    ).to_list(length=None)
    
    admin_emails = [emp.get("email") for emp in admins if emp.get("email")]
    
    # Fallback: nếu không có admin nào trong DB, dùng ADMIN_EMAIL từ .env
    if not admin_emails and ADMIN_EMAIL:
        admin_emails = [ADMIN_EMAIL]
    
    logger.info("Found %d admin emails", len(admin_emails))
    return admin_emails

# ---------------- Static Strategy ----------------
async def compute_percentile_thresholds(percentile: int = STATIC_PERCENTILE):
    products = await db.products.find({}, {"viewCount":1, "saleNumber":1}).to_list(length=None)
    if not products:
        return {"view_th": 50, "order_th": 5}

    views = sorted([p.get("viewCount",0) for p in products])
    orders = sorted([p.get("saleNumber",0) for p in products])

    def pct(arr, p):
        if not arr:
            return 0
        k = int(len(arr)*p/100)
        k = min(max(k,0), len(arr)-1)
        return int(arr[k])

    v_th = max(1, pct(views, percentile))
    o_th = max(1, pct(orders, percentile))
    logger.info("Thresholds: view=%s order=%s", v_th, o_th)
    return {"view_th": v_th, "order_th": o_th}

async def run_static_classification():
    thresholds = await compute_percentile_thresholds()
    v_th, o_th = thresholds["view_th"], thresholds["order_th"]

    products = await db.products.find({}, {"_id":1,"viewCount":1,"saleNumber":1,"name":1}).to_list(length=None)
    summary = {"high_high":0, "low_high":0, "high_low":0, "low_low":0}

    for p in products:
        pid = p["_id"]
        views = p.get("viewCount",0)
        orders = p.get("saleNumber",0)

        if views >= v_th and orders >= o_th:
            grp = "high_high"
        elif views < v_th and orders >= o_th:
            grp = "low_high"
        elif views >= v_th and orders < o_th:
            grp = "high_low"
        else:
            grp = "low_low"

        await db.products.update_one(
            {"_id": pid},
            {"$set": {
                "group": grp,
                "last_group_updated_at": datetime.utcnow()
            }}
        )
        summary[grp] += 1

    # Send summary email to all admin employees
    admin_emails = await get_admin_emails()

    report_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    body = f"""
    Hello Admin Team,

    The daily product classification process has been completed successfully.
    Below is the summary of product distribution based on the 4-quadrant marketing matrix:

    ────────────────────────────────────────
    📊 Classification Summary:
    - High View – High Order (Core Products):        {summary['high_high']} items
    - Low View – High Order (Potential Products):     {summary['low_high']} items
    - High View – Low Order (Barrier Products):       {summary['high_low']} items
    - Low View – Low Order (Clearance Products):     {summary['low_low']} items
    ────────────────────────────────────────

    🕒 Process Time:
    - Executed at: {report_time}
    - Thresholds Used:
        • View Threshold: {v_th}
        • Order Threshold: {o_th}

    📌 Notes:
    These groups are automatically updated in the system based on percentile thresholds.
    This ensures that product recommendations, homepage highlights, and promotional actions
    always reflect the latest performance data.

    Best regards,
    Bunny Store Automated Marketing System
    """

    for admin_email in admin_emails:
        await send_email(
            admin_email,
            "[Bunny Store] Daily Product Classification Report",
            body
        )
    
    logger.info("Static classification finished")

# schedule nightly run
scheduler.add_job(run_static_classification, CronTrigger(hour=CRON_HOUR, minute=0), id="nightly_static")

# ---------------- Dynamic Strategy ----------------
async def schedule_delayed_remark(user_id: str, product_id: str, product_name: Optional[str]):
    """MongoDB-based lock to prevent duplicate email scheduling"""
    lock_key = f"scheduled:{user_id}:{product_id}"
    lock_doc = {
        "_id": lock_key,
        "userId": ObjectId(user_id),
        "productId": ObjectId(product_id),
        "createdAt": datetime.utcnow(),
        "expiresAt": datetime.utcnow() + timedelta(minutes=DELAY_MINUTES_AFTER_THRESHOLD+10)
    }
    
    try:
        # Try to insert lock document - if it exists, skip
        await db.remarksScheduled.insert_one(lock_doc)
    except:
        # Document already exists, skip to prevent duplicate
        logger.info("Remark already scheduled for %s:%s", user_id, product_id)
        return
    
    run_at = datetime.utcnow() + timedelta(minutes=DELAY_MINUTES_AFTER_THRESHOLD)
    scheduler.add_job(func=delayed_remark_job, trigger="date", run_date=run_at,
                      args=[user_id, product_id, product_name],
                      id=f"delayed_{user_id}_{product_id}_{int(datetime.utcnow().timestamp())}")
    logger.info("Scheduled delayed remark for %s:%s", user_id, product_id)

async def delayed_remark_job(user_id: str, product_id: str, product_name: Optional[str]):
    """Send cart abandonment reminder email to user (30 mins after add_to_cart)"""
    # Check if user already purchased this product
    purchased = await db.orders.find_one({
        "customerInfo.userId": user_id,
        "products.productId": ObjectId(product_id)
    })
    if purchased:
        logger.info(f"User {user_id} already purchased {product_name}, skipping reminder")
        return

    # Retrieve user and send personalized reminder email
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    email_to = user_doc.get("email") if user_doc else None
    user_name = user_doc.get("name", "Valued Customer") if user_doc else "Valued Customer"
    
    if email_to:
        # Create text email reminder
        body = f"""Dear {user_name},

We noticed that you left "{product_name}" in your shopping cart. We want to make sure you don't miss out on this product!

Complete your purchase now to secure this item. Our inventory is limited, and popular products sell out quickly.

Visit your cart: http://localhost:3000/all-orders

Why complete your purchase today?
- Secure your item before stock runs out
- Fast and secure checkout process
- Multiple payment options available
- Dedicated customer support

If you have any questions about this product or need assistance, please contact our customer support team at support@yourshop.com.

Best regards,
The Bunny Store Team

---
This is an automated reminder email. Please do not reply directly to this message.
"""
        
        await send_email(
            email_to,
            f"Complete Your Purchase: {product_name}",
            body
        )
        logger.info(f"Reminder email sent to {email_to} for product {product_name}")
    else:
        # Fallback: notify admins about missing user email
        admin_emails = await get_admin_emails()
        alert_body = f"""Alert: Cannot Send Cart Abandonment Reminder

The system could not send a cart abandonment reminder because the user's email address was not found.

Details:
- User ID: {user_id}
- Product: {product_name}
- Reason: User email not found in database

Action Required: Please verify the user account and update the email address in the system.
"""
        
        for admin_email in admin_emails:
            await send_email(
                admin_email,
                f"Alert: Cannot Send Reminder for User {user_id}",
                alert_body
            )

# ---------------- WebSocket ----------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}  # key: user_id

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, user_id: str, message: dict):
        ws = self.active_connections.get(user_id)
        if ws:
            await ws.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# ---------------- API endpoints ----------------
@app.post("/events")
async def receive_event(event: UserEvent, background_tasks: BackgroundTasks):
    try:
        ts = event.ts or datetime.utcnow()
        # 1️⃣ Add/remove cart
        if event.action in ["add_to_cart", "remove_from_cart"]:
            await db.cartInteractions.insert_one({
                "userId": ObjectId(event.user_id),
                "productId": ObjectId(event.product_id),
                "action": event.action,
                "quantity": 1,
                "createdAt": ts,
                "updatedAt": ts
            })

        # 2️⃣ Add to cart - schedule delayed email
        if event.action == "add_to_cart":
            p = await db.products.find_one({"_id": ObjectId(event.product_id)})
            background_tasks.add_task(
                schedule_delayed_remark,
                event.user_id,
                event.product_id,
                p.get("name") if p else None
            )

        # 3️⃣ Remove from cart - cancel scheduled email
        if event.action == "remove_from_cart":
            # Tạo lock key giống schedule_delayed_remark
            lock_key = f"scheduled:{event.user_id}:{event.product_id}"
            
            # Xóa document trong MongoDB để unlock
            await db.remarksScheduled.delete_one({"_id": lock_key})

            # Xóa job trong scheduler nếu tồn tại
            for job in scheduler.get_jobs():
                if job.id.startswith(f"delayed_{event.user_id}_{event.product_id}_"):
                    scheduler.remove_job(job.id)
                    logger.info("Cancelled delayed remark for %s:%s", event.user_id, event.product_id)

        # 4️⃣ Purchase
        if event.action == "purchase":
            await db.orders.update_many(
                {"customerInfo.userId": ObjectId(event.user_id), "products.productId": ObjectId(event.product_id)},
                {"$set": {"status": "purchased", "updatedAt": datetime.utcnow()}}
            )

        # 5️⃣ Realtime FE
        if event.action in ["view", "add_to_cart"]:
            p = await db.products.find_one({"_id": ObjectId(event.product_id)})
            if p:
                data = {
                    "product_id": str(p["_id"]),
                    "name": p.get("name"),
                    "price": p.get("price"),
                    "views": p.get("viewCount",0),
                    "saleNumber": p.get("saleNumber",0),
                    "group": p.get("group","unclassified"),
                    "action": event.action,
                    "timestamp": ts.isoformat()
                }
                await manager.send_personal_message(event.user_id, data)

        return {"status": "ok"}
    except Exception as e:
        logger.exception("Error processing event")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/run-static-now")
async def api_run_static_now():
    await run_static_classification()
    return {"status":"ok"}

@app.get("/admin/groups")
async def api_get_groups(limit:int=200):
    cursor = db.products.find({}, {"_id":1,"name":1,"price":1,"viewCount":1,"saleNumber":1,"group":1}).limit(limit)
    items_raw = await cursor.to_list(length=limit)
    items = [{
        "_id": str(p["_id"]),
        "name": p.get("name"),
        "price": p.get("price"),
        "views": p.get("viewCount",0),
        "saleNumber": p.get("saleNumber",0),
        "group": p.get("group","unclassified")
    } for p in items_raw]
    return {"count": len(items), "items": items}

@app.post("/admin/send-summary")
async def api_send_summary_now():
    pipeline = [{"$group":{"_id":"$group","count":{"$sum":1}}}]
    res = await db.products.aggregate(pipeline).to_list(length=None)
    summary = {r["_id"] if r["_id"] else "unclassified": r["count"] for r in res}
    report_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    v_th, o_th = (await compute_percentile_thresholds()).values()  # nếu muốn show thresholds
    body = f"""
    Hello Admin Team,

    The daily product classification process has been completed successfully.
    Below is the summary of product distribution based on the 4-quadrant marketing matrix:

    ────────────────────────────────────────
    📊 Classification Summary:
    - High View – High Order (Core Products):        {summary['high_high']} items
    - Low View – High Order (Potential Products):     {summary['low_high']} items
    - High View – Low Order (Barrier Products):       {summary['high_low']} items
    - Low View – Low Order (Clearance Products):     {summary['low_low']} items
    ────────────────────────────────────────

    🕒 Process Time:
    - Executed at: {report_time}
    - Thresholds Used:
        • View Threshold: {v_th}
        • Order Threshold: {o_th}

    📌 Notes:
    These groups are automatically updated in the system based on percentile thresholds.
    This ensures that product recommendations, homepage highlights, and promotional actions
    always reflect the latest performance data.

    Best regards,
    Bunny Store Automated Marketing System
    """

    # Send to all admin employees
    admin_emails = await get_admin_emails()
    for admin_email in admin_emails:
        await send_email(admin_email, "[Marketing] Manual Summary", body)
    
    return {"status":"email_sent", "summary": summary, "admin_count": len(admin_emails)}

@app.get("/products/by-group/{group_name}")
async def api_products_by_group(group_name: str, limit: int = 20, offset: int = 0):
    valid_groups = ["high_high", "low_high", "high_low", "low_low", "unclassified"]

    if group_name not in valid_groups:
        return {"error": "Invalid group name", "valid_groups": valid_groups}

    cursor = db.products.find(
        {"group": group_name},
        {"name": 1, "price": 1, "viewCount": 1, "saleNumber": 1, "group": 1}
    ).skip(offset).limit(limit)

    products = await cursor.to_list(length=None)

    return {
        "group": group_name,
        "count": len(products),
        "products": [
                {
                "id": str(p["_id"]),
                "name": p.get("name"),
                "price": p.get("price"),
                "views": p.get("viewCount", 0),
                "saleNumber": p.get("saleNumber", 0),
                "group": p.get("group"),
            }
            for p in products
        ]
    }
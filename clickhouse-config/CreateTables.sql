create database kafka;

CREATE TABLE kafka.events (
  timestamp DateTime,
  eventType String,
  visitorId String,
  sessionId String,
  url String,
  action String
) ENGINE = MergeTree()
ORDER BY (timestamp);

-------------------------------------------------
-------------------------------------------------
-------------------------------------------------

CREATE DATABASE analytics;


CREATE TABLE analytics.sessions
(
    -- Core identifiers
    sessionId String,
    visitorId String,

    -- Session timing
    startTime DateTime,
    endTime DateTime,

    -- URLs
    urlStart String,
    urlEnd String,

    -- Idle / dwell
    totalIdleSeconds UInt32,
    dwellSeconds UInt32,

    -- 🔥 NEW METRICS
    totalClicks UInt32,          -- count of click events
    totalActions UInt32,         -- all activity events (click, move, keydown...)
    totalPageViews UInt32,       -- count of page_view events
    productViews UInt32,         -- URL matches /all-products/product/<id>
    urlMostActive String,        -- URL with highest activity

    -- Optional ingestion version
    _version UInt64 DEFAULT 1
)
ENGINE = ReplacingMergeTree(_version)
ORDER BY (sessionId);




CREATE TABLE analytics.active_session_count (
    count Int32,
    timestamp DateTime,
    updated_at DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY timestamp;



-------------------------------------------------
-------------------------------------------------
-------------------------------------------------


CREATE TABLE analytics.active_sessions
(
    sessionId String,
    visitorId String,
    lastEventTime DateTime,
    lastEventType String,
    url String,
    _version UInt64
)
ENGINE = ReplacingMergeTree(_version)
ORDER BY sessionId
TTL lastEventTime + INTERVAL 8 MINUTE DELETE;




---------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_events_to_active_sessions
TO analytics.active_sessions
AS
SELECT
    sessionId,
    visitorId,
    timestamp AS lastEventTime,
    eventType AS lastEventType,
    url,
    toUnixTimestamp(timestamp) AS _version
FROM kafka.events;






--------------------------------------------------
-----------------------------------------------



CREATE TABLE analytics.fraud_sessions (
    sessionId String,
    userId String,
    fraud_score UInt8,
    fraud_level String,
    rulesHit Array(String),
    startTime DateTime,
    endTime DateTime
) 
ENGINE = ReplacingMergeTree()
ORDER BY (sessionId, endTime);


CREATE TABLE analytics.fraud_users (
    userId String,
    last_detected DateTime,
    total_fraud UInt32,
    last_rules Array(String),
    risk_level String
)
ENGINE = ReplacingMergeTree()
ORDER BY userId;


CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.mv_fraud_users
TO analytics.fraud_users
AS
SELECT
  userId,
  max(endTime) as last_detected,
  count() as total_fraud,
  arrayConcat(groupArray(rulesHit)) as last_rules,
  CASE 
    WHEN count() >= 5 THEN 'high'
    WHEN count() >= 3 THEN 'medium'
    ELSE 'low'
  END as risk_level
FROM analytics.fraud_sessions
GROUP BY userId;








--------------------------------------------------
---check size

SELECT
        `table`,
        formatReadableSize(sum(data_compressed_bytes)) AS compressed_size
FROM system.parts
WHERE (database = 'kafka') AND active
GROUP BY `table`;











SELECT * FROM "kafka"."events" order by timestamp desc limit 100





--------------------------------------------------------------
--------------------------------------------------------------
--------------------------------------------------------------
--------------------------------------------------------------
---KQL query
.create table active_sessions_latest
(
    sessionId: string,
    visitorId: string,
    lastEventTime: datetime,
    lastEventType: string,
    url: string,
    action: string,
    _producerTimestamp: datetime
)



.alter table active_sessions_latest policy update 
@'[ {  "IsEnabled": true,    "Source": "Tracking_raw",    "Query": "Tracking_raw | project sessionId, visitorId=userId, lastEventTime=unixtime_milliseconds_todatetime(timestamp), lastEventType=type, url, action, _producerTimestamp=unixtime_milliseconds_todatetime(_producerTimestamp)","IsTransactional": false,"PropagateIngestionProperties": false,    "IsUpdate": true,    "IsReplace": true,    "Lookback": "30m"}]'



---- to query active sessions
active_sessions_latest
| summarize arg_max(lastEventTime, *) by sessionId
| where lastEventType != "page_exit"


.alter-merge table active_sessions_latest policy retention softdelete = 7d recoverability = disabled

--------------------------------------------------------------
--------------------------------------------------------------
--------------------------------------------------------------
--------------------------------------------------------------
.create table EndSession (
    sessionId: string,
    visitorId: string,
    startTime: datetime,
    endTime: datetime,
    urlStart: string,
    urlEnd: string,
    totalIdleSeconds: int,
    dwellSeconds: int,
    totalClicks: int,
    totalActions: int,
    totalPageViews: int,
    productViews: int,
    urlMostActive: string,
    _version: long
)




.create-or-alter function BuildEndSession()
{
    Tracking_raw
    | extend ts = unixtime_milliseconds_todatetime(timestamp)
    | summarize
        visitorId      = any(userId),
        startTime      = min(ts),
        endTime        = max(ts),
        urlStart       = tostring( arg_min(ts, url).url ),
        urlEnd         = tostring( arg_max(ts, url).url ),
        totalClicks    = countif(type == "action" and action == "click"),
        totalActions   = countif(type == "action"),
        totalPageViews = countif(type == "page_view"),
        productViews   = dcountif(url, url matches regex @"all-products\/product\/[\w\-]+$"),
        // urlMostActive  = tostring( arg_max(countif(type=="action"), url) ),
        totalIdleSeconds = 0,
        dwellSeconds     = datetime_diff("second", max(ts), min(ts)),
        _version       = tolong(now())
      by sessionId
}





spark.sql("""
CREATE TABLE IF NOT EXISTS Track_Curated.EndSession (
    sessionId STRING,
    visitorId STRING,

    startTime TIMESTAMP,
    endTime TIMESTAMP,

    urlStart STRING,
    urlEnd STRING,

    totalClicks INT,
    totalActions INT,
    totalPageViews INT,
    productViews INT,

    totalIdleSeconds INT,
    dwellSeconds INT,

    urlMostActive STRING,

    _version LONG
)
USING DELTA
""")











-- 1. Read last watermar
DECLARE @last_ts BIGINT = ISNULL((
    SELECT last_load_ts
    FROM gold_watermark
    WHERE table_name = 'suppliers'
), 0);
-- 2. Prepare latest changes (one row per supplier)
WITH LatestChanges AS (
    SELECT
        _id AS supplier_id,
        name,
        email,
        phone,
        address,
        totalCost AS total_cost,
        payload_op AS update_type,
        payload_ts_ms,
        ROW_NUMBER() OVER (PARTITION BY _id ORDER BY payload_ts_ms DESC) AS rn
    FROM Lakehouse.silver_zone.suppliers
    WHERE payload_ts_ms > @last_ts
),
CurrentVersion AS (
    SELECT *
    FROM LatestChanges
    WHERE rn = 1
)
-- 3. MERGE (close old versions + insert new ones)
MERGE INTO gold_zone.dim_suppliers AS dest
USING CurrentVersion AS src
    ON dest.supplier_id = src.supplier_id
   AND dest.is_current = 1
-- A) Change detected → close existing row
WHEN MATCHED AND (
       ISNULL(dest.name, N'')          <> ISNULL(src.name, N'')
    OR ISNULL(dest.email, N'')         <> ISNULL(src.email, N'')
    OR ISNULL(dest.phone, N'')         <> ISNULL(src.phone, N'')
    OR ISNULL(dest.address, N'')       <> ISNULL(src.address, N'')
    OR ISNULL(dest.total_cost, -1)     <> ISNULL(src.total_cost, -1)
) THEN
    UPDATE SET
        dest.valid_to = SYSUTCDATETIME(),
        dest.is_current = 0,
        dest.update_type = 'U'
-- B) New supplier → insert first version
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        supplier_id, name, email, phone, address, total_cost,
        valid_from, valid_to, is_current, update_type
    )
    VALUES (
        src.supplier_id, src.name, src.email, src.phone, src.address, src.total_cost,
        SYSUTCDATETIME(), NULL, 1, 'I'
    );
-- 4. Insert NEW current version for updated suppliers
WITH LatestChanges AS (
    SELECT
        _id AS supplier_id,
        name,
        email,
        phone,
        address,
        totalCost AS total_cost,
        payload_op AS update_type,
        payload_ts_ms,
        ROW_NUMBER() OVER (PARTITION BY _id ORDER BY payload_ts_ms DESC) AS rn
    FROM Lakehouse.silver_zone.suppliers
    WHERE payload_ts_ms > @last_ts
),
CurrentVersion AS (
    SELECT * FROM LatestChanges WHERE rn = 1
),
JustClosed AS (
    SELECT d.supplier_id
    FROM gold_zone.dim_suppliers d
    JOIN CurrentVersion c ON d.supplier_id = c.supplier_id
    WHERE d.is_current = 0
      AND d.valid_to >= DATEADD(SECOND, -60, SYSUTCDATETIME())
)
INSERT INTO gold_zone.dim_suppliers (
    supplier_id, name, email, phone, address, total_cost,
    valid_from, valid_to, is_current, update_type
)
SELECT
    src.supplier_id,
    src.name,
    src.email,
    src.phone,
    src.address,
    src.total_cost,
    SYSUTCDATETIME(),
    NULL,
    1,
    'U'
FROM CurrentVersion src
JOIN JustClosed jc ON src.supplier_id = jc.supplier_id;
-- 5. Update watermark
UPDATE gold_watermark
SET last_load_ts = (
    SELECT MAX(payload_ts_ms)
    FROM Lakehouse.silver_zone.suppliers
    WHERE payload_ts_ms > @last_ts
)
WHERE table_name = 'suppliers';
PRINT N'dim_suppliers updated successfully – Latest version only SCD2 applied.';
require('dotenv').config()
const product = require('../../models/productModel')
const user = require('../../models/userModel')
const order = require('../../models/orderModel')
const store = require('../../models/storeModel')
const brand = require('../../models/brandModel')
const employee = require('../../models/employeeModel')
const purchase = require('../../models/purchaseModel')
const supplier = require('../../models/supplierModel')
const notification = require('../../models/notificationModel')
const orderStatus = require('../../models/orderStatusModel')
const member = require('../../models/memberModel')
const position = require('../../models/positionModel')
const { clickhouse } = require('../../kafka/ClickhouseConection');
const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379"
});

redisClient.connect().then(() => {
  console.log("Connected to Redis.");
}).catch(err => {
  console.error("Redis connection error:", err);
});


class homeController {
  async show(req, res, next) {
    try {
      return res.render('admin/home', { title: 'Home', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async getFinance(req, res, next) {
    try {
      const matchStage = {}
      const userInfo = await employee.findOne({ _id: req.cookies.uid }).lean()
      if (!userInfo) throw new Error('User not found')

      const start = new Date(req.body.startDate) || null
      const end = new Date(req.body.endDate) || null

      if (req.body.startDate && req.body.endDate) {
        matchStage.createdAt = {
          $gte: new Date(start),
          $lte: new Date(end),
        }
      }

      const revenueFilter = {
        ...matchStage,
        status: { $ne: 'cancel' },
        isPaid: true
      }

      const revenue = await order.aggregate([
        {
          $match: revenueFilter
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$totalOrderPrice' },
          },
        },
      ])

      const cost = await purchase.aggregate([
        {
          $match: matchStage
        },
        {
          $group: {
            _id: null,
            cost: { $sum: '$totalPurchasePrice' },
          },
        },
      ])

      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const wage = await employee.aggregate([
        {
          $lookup: {
            from: 'positions',
            localField: 'role',
            foreignField: 'code',
            as: 'position',
          },
        },
        {
          $unwind: '$position'
        },
        {
          $group: {
            _id: null,
            wage: { $sum: '$position.wage' },
          },
        },
        {
          $addFields: {
            totalWageForRange: {
              $divide: [{ $multiply: ["$wage", diffDays] }, 30],
            },
          },
        }
      ])

      return res.json({ 
        revenue: revenue.length > 0 ? revenue[0].revenue.toFixed(0)        : 0,
        cost   : cost.length    > 0 ? cost[0].cost.toFixed(0)              : 0,
        wage   : wage.length    > 0 ? wage[0].totalWageForRange.toFixed(0) : 0,
      })
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getBrands(req, res, next) {
    try {
      const brands = await brand.find().lean()
      return res.json({data: brands})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getCustomers(req, res, next) {
    try {
      const matchStage = {}
      if (req.body.startDate && req.body.endDate) {
        matchStage.createdAt = {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        }
      }

      const [allCustomers, filteredCustomers, members] = await Promise.all([
        user.estimatedDocumentCount(),
        user.find(matchStage).lean(),
        member.find().lean()
      ])

      return res.json({allData: allCustomers, data: filteredCustomers, members: members})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getEmployees(req, res, next) {
    try {
      const matchStage = {}
      if (req.body.startDate && req.body.endDate) {
        matchStage.createdAt = {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        }
      }

      const [totalEmployees, filteredEmployees, positions] = await Promise.all([
        employee.estimatedDocumentCount(),
        employee.find(matchStage).lean(),
        position.find().lean()
      ])

      return res.json({allData: totalEmployees, data: filteredEmployees, positions: positions})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getOrders(req, res, next) {
    try {
      const matchStage = {}
      if (req.body.startDate && req.body.endDate) {
        matchStage.createdAt = {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        }
      }

      const [allOrders, filterOrders, status] = await Promise.all([
        order.estimatedDocumentCount(),
        order.find(matchStage).lean(),
        orderStatus.find().lean()
      ])
      
      return res.json({allData: allOrders, data: filterOrders, status: status})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getProducts(req, res, next) {
    try {
      const products = await product.find({ deletedAt: null }).lean()
      return res.json({data: products})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getPurchases(req, res, next) {
    try {
      const matchStage = {}
      if (req.body.startDate && req.body.endDate) {
        matchStage.createdAt = {
          $gte: new Date(req.body.startDate),
          $lte: new Date(req.body.endDate),
        }
      }
      
      const purchases = await purchase.find(matchStage).lean()
      return res.json({data: purchases})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getStores(req, res, next) {
    try {
      const stores = await store.find().lean()
      return res.json({data: stores})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getSuppliers(req, res, next) {
    try {
      const suppliers = await supplier.find().lean()
      return res.json({data: suppliers})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async getUser(req, res, next) {
    try {
      const userId = req.cookies.uid || ''
      if (!userId) throw new Error('User not found')
      
      const userInfo = await employee.findOne({ _id: userId }).lean()
      if (!userInfo) throw new Error('User not found')
      
      return res.json({data: userInfo})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async getNotification(req, res, next) {
    try {
      const notifications = await notification.find({receiverId: req.cookies.uid}).sort({updatedAt: -1}).lean()
      return res.json({data: notifications})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async setNotification(req, res, next) {
    try {
      const {message, type, userId} = req.body

      if (type === 'message') {
        const userInfo = await user.findOne({_id: userId}).lean()

        const newNotification = new notification({
          message   : `${userInfo.name}: ${message}`,
          receiverId: process.env.ADMIN_ID,
          isRead    : false,
          type      : type,
        });
        await newNotification.save()
      }
      
      return res.json({isValid: true, message: 'Add notification successfully'})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async updateNotification(req, res, next) {
    try {
      await notification.updateOne({ _id: req.body.id }, {
        isRead: true
      })
      return res.json({message: 'Update information successfully'})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
  
  async updateAllNotifications(req, res, next) {
    try {
      await notification.updateMany({ receiverId: req.cookies.uid, isRead: false }, {
        isRead: true
      })
      return res.json({message: 'Update information successfully'})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }


  // async getActiveUsersRealtime(req, res) {
  //   try {
  //     // Query ClickHouse via the shared client
  //     const sql = `
  //       SELECT count(sessionId) AS active
  //       FROM analytics.active_sessions FINAL
  //       WHERE lastEventType <> 'page_exit'
  //     `;

  //     const result = await clickhouse.query({
  //       query: sql,
  //       format: 'JSONEachRow'
  //     });

  //     const rows = await result.json();

  //     return res.json({
  //       current: rows.length > 0 ? rows[0].active : 0
  //     });

  //   } catch (error) {
  //     console.error("ClickHouse realtime error:", error);
  //     return res.json({ error: error.message });
  //   }
  // }

async getActiveUsersRealtime(req, res) {
  try {
    let cursor = "0";
    let total = 0;

    do {
      const reply = await redisClient.scan(cursor, {
        MATCH: "active:*",
        COUNT: 500
      });

      cursor = reply.cursor;
      total += reply.keys.length;

    } while (cursor !== "0");

    return res.json({ 
      current: total,
      timestamp: Date.now()  // ✅ Add timestamp
    });

  } catch (error) {
    console.error("Redis realtime error:", error);
    return res.json({ 
      current: 0,
      timestamp: Date.now()  // ✅ Even on error, include timestamp
    });
  }
}

async getSessionKPIs(req, res, next) {
  try {
    console.log("🔍 getSessionKPIs called");
    const { startDate, endDate } = req.body
    console.log("📅 Dates received:", { startDate, endDate });

    if (!startDate || !endDate) {
      console.log("❌ Missing dates");
      return res.json({
        error: 'startDate and endDate required'
      })
    }

    // Query 1: Sessions > 5 seconds ratio
    console.log("📊 Executing Query 1: Long Sessions");
    const longSessionsResult = await clickhouse.query({
      query: `
        SELECT 
          countIf(dwellSeconds > 5) as longSessions,
          count() as totalSessions,
          (countIf(dwellSeconds > 5) / count()) * 100 as ratio
        FROM analytics.sessions
        WHERE startTime >= toDateTime('${startDate}') AND startTime <= toDateTime('${endDate}')
      `
    })

    const longSessionsData = await longSessionsResult.json()
    console.log("✅ Query 1 result:", JSON.stringify(longSessionsData, null, 2));
    
    // Query 2: User comeback rate
    console.log("📊 Executing Query 2: Comeback Rate");
    const comebackResult = await clickhouse.query({
      query: `
        SELECT 
          uniqIf(visitorId, sessionCount >= 2) as returningUsers,
          uniq(visitorId) as totalUsers,
          (uniqIf(visitorId, sessionCount >= 2) / uniq(visitorId)) * 100 as comebackRate
        FROM (
          SELECT 
            visitorId,
            count() as sessionCount
          FROM analytics.sessions
          WHERE startTime >= toDateTime('${startDate}') AND startTime <= toDateTime('${endDate}')
          GROUP BY visitorId
        )
      `
    })

    const comebackData = await comebackResult.json()
    console.log("✅ Query 2 result:", JSON.stringify(comebackData, null, 2));

    const longSessionRatio = longSessionsData.data[0]?.ratio || 0
    const comeback = comebackData.data[0]?.comebackRate || 0
    
    console.log("📈 Final values:", { longSessionRatio, comeback });

    const response = {
      success: true,
      data: {
        longSessionRatio: Number(longSessionRatio).toFixed(2),
        comebackRate: Number(comeback).toFixed(2)
      }
    };
    
    console.log("📤 Sending response:", JSON.stringify(response, null, 2));
    return res.json(response)
  } catch (error) {
    console.error('❌ Error fetching session KPIs:', error)
    return res.json({ error: error.message })
  }
}


}
module.exports = new homeController
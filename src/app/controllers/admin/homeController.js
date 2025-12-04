require('dotenv').config()
    const http = require('http')
const https = require('https')
const { URL } = require('url')
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

      // Fetch daily revenue chart data from Fabric FastAPI
      let dailyRevenue = []
      let revenueByBrand = []
      let revenueByCategory = []
      let revenueBySubcategory = []

      try {
        // Convert ISO dates to YYYY-MM-DD format
        const startDate = req.body.startDate ? req.body.startDate.split('T')[0] : ''
        const endDate = req.body.endDate ? req.body.endDate.split('T')[0] : ''
        
        if (!startDate || !endDate) {
          console.log('[getFinance] Missing dates for charts')
        } else {
          const fabricBase = process.env.FABRIC_API_URL || 'http://127.0.0.1:8000'

          // Helper function to fetch from Fabric API
          const fetchFromFabric = (endpoint, top = 20) => {
            return new Promise((resolve) => {
              const urlString = `${fabricBase.replace(/\/$/, '')}${endpoint}?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}&top=${top}`
              console.log(`[getFinance] Fetching from: ${endpoint}`)
              
              const urlObj = new URL(urlString)
              const client = urlObj.protocol === 'https:' ? https : http

              const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                timeout: 10000
              }

              const req2 = client.request(options, (resp) => {
                console.log(`[getFinance] Response from ${endpoint}: ${resp.statusCode}`)
                let raw = ''
                resp.setEncoding('utf8')
                resp.on('data', (chunk) => raw += chunk)
                resp.on('end', () => {
                  try {
                    const parsed = JSON.parse(raw)
                    console.log(`[getFinance] Parsed ${endpoint}, items: ${Array.isArray(parsed) ? parsed.length : 'not-array'}`)
                    resolve(parsed)
                  } catch (err) {
                    console.error(`[getFinance] JSON parse error for ${endpoint}:`, err.message)
                    resolve([])
                  }
                })
              })
              req2.on('error', (err) => {
                console.error(`[getFinance] Fetch error for ${endpoint}:`, err.message)
                resolve([])
              })
              req2.on('timeout', () => {
                console.error(`[getFinance] Timeout for ${endpoint}`)
                req2.destroy()
                resolve([])
              })
              req2.end()
            })
          }

          // Fetch all charts in parallel
          const [daily, brand, category, subcategory] = await Promise.all([
            fetchFromFabric('/chart/revenue-daily'),
            fetchFromFabric('/chart/revenue-by-brand', 20),
            fetchFromFabric('/chart/revenue-by-category', 10),
            fetchFromFabric('/chart/revenue-by-subcategory', 20)
          ])

          dailyRevenue = daily
          revenueByBrand = brand
          revenueByCategory = category
          revenueBySubcategory = subcategory
          
          console.log('[getFinance] Fetched data summary:')
          console.log(`  - dailyRevenue: ${Array.isArray(daily) ? daily.length : 'not-array'} items`)
          console.log(`  - revenueByBrand: ${Array.isArray(brand) ? brand.length : 'not-array'} items`, brand)
          console.log(`  - revenueByCategory: ${Array.isArray(category) ? category.length : 'not-array'} items`, category)
          console.log(`  - revenueBySubcategory: ${Array.isArray(subcategory) ? subcategory.length : 'not-array'} items`, subcategory)
        }
      } catch (err) {
        console.error('[getFinance] Exception fetching charts:', err.message, err.stack)
      }

      return res.json({ 
        revenue: revenue.length > 0 ? revenue[0].revenue.toFixed(0)        : 0,
        cost   : cost.length    > 0 ? cost[0].cost.toFixed(0)              : 0,
        wage   : wage.length    > 0 ? wage[0].totalWageForRange.toFixed(0) : 0,
        dailyRevenue: dailyRevenue,
        revenueByBrand: revenueByBrand,
        revenueByCategory: revenueByCategory,
        revenueBySubcategory: revenueBySubcategory
      })
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async getRevenueByBrand(req, res, next) {
    try {
      const { startDate, endDate, top = 20 } = req.body
      
      if (!startDate || !endDate) {
        return res.json({ error: 'Missing required parameters: startDate, endDate' })
      }

      const start = startDate.split('T')[0]
      const end = endDate.split('T')[0]

      const fabricBase = process.env.FABRIC_API_URL || 'http://127.0.0.1:8000'
      const urlString = `${fabricBase.replace(/\/$/, '')}/chart/revenue-by-brand?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&top=${top}`
      
      const urlObj = new URL(urlString)
      const client = urlObj.protocol === 'https:' ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      }

      const data = await new Promise((resolve) => {
        const req2 = client.request(options, (resp) => {
          let raw = ''
          resp.setEncoding('utf8')
          resp.on('data', (chunk) => raw += chunk)
          resp.on('end', () => {
            try {
              resolve(JSON.parse(raw))
            } catch (err) {
              resolve([])
            }
          })
        })
        req2.on('error', () => resolve([]))
        req2.on('timeout', () => {
          req2.destroy()
          resolve([])
        })
        req2.end()
      })

      return res.json(data)
    } catch (error) {
      console.log(error)
      return res.json({ error: error.message })
    }
  }

  async getRevenueByCategory(req, res, next) {
    try {
      const { startDate, endDate, top = 10 } = req.body
      
      if (!startDate || !endDate) {
        return res.json({ error: 'Missing required parameters: startDate, endDate' })
      }

      const start = startDate.split('T')[0]
      const end = endDate.split('T')[0]

      const fabricBase = process.env.FABRIC_API_URL || 'http://127.0.0.1:8000'
      const urlString = `${fabricBase.replace(/\/$/, '')}/chart/revenue-by-category?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&top=${top}`
      
      const urlObj = new URL(urlString)
      const client = urlObj.protocol === 'https:' ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      }

      const data = await new Promise((resolve) => {
        const req2 = client.request(options, (resp) => {
          let raw = ''
          resp.setEncoding('utf8')
          resp.on('data', (chunk) => raw += chunk)
          resp.on('end', () => {
            try {
              resolve(JSON.parse(raw))
            } catch (err) {
              resolve([])
            }
          })
        })
        req2.on('error', () => resolve([]))
        req2.on('timeout', () => {
          req2.destroy()
          resolve([])
        })
        req2.end()
      })

      return res.json(data)
    } catch (error) {
      console.log(error)
      return res.json({ error: error.message })
    }
  }

  async getRevenueBySubcategory(req, res, next) {
    try {
      const { startDate, endDate, top = 20 } = req.body
      
      if (!startDate || !endDate) {
        return res.json({ error: 'Missing required parameters: startDate, endDate' })
      }

      const start = startDate.split('T')[0]
      const end = endDate.split('T')[0]

      const fabricBase = process.env.FABRIC_API_URL || 'http://127.0.0.1:8000'
      const urlString = `${fabricBase.replace(/\/$/, '')}/chart/revenue-by-subcategory?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&top=${top}`
      
      const urlObj = new URL(urlString)
      const client = urlObj.protocol === 'https:' ? https : http

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      }

      const data = await new Promise((resolve) => {
        const req2 = client.request(options, (resp) => {
          let raw = ''
          resp.setEncoding('utf8')
          resp.on('data', (chunk) => raw += chunk)
          resp.on('end', () => {
            try {
              resolve(JSON.parse(raw))
            } catch (err) {
              resolve([])
            }
          })
        })
        req2.on('error', () => resolve([]))
        req2.on('timeout', () => {
          req2.destroy()
          resolve([])
        })
        req2.end()
      })

      return res.json(data)
    } catch (error) {
      console.log(error)
      return res.json({ error: error.message })
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
}
module.exports = new homeController
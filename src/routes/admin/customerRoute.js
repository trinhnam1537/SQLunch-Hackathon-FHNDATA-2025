const express = require('express')
const router = express.Router()
const customerController = require('../../app/controllers/admin/customerController')
const customerPermission = require('../../app/middleware/checkPermission').customerClass

router.get('/'                  , customerPermission.read   , customerController.allCustomers)
router.get('/customer/create'   , customerPermission.create , customerController.createCustomer)
router.get('/customer/:id'      , customerPermission.update , customerController.customerInfo)

router.post('/customer/created' , customerController.customerCreated)
router.put('/customer/updated'  , customerController.customerUpdate)

router.post('/data/customers'   , customerController.getCustomers)
router.post('/data/customer'    , customerController.getCustomer)
router.post('/data/filter'      , customerController.getFilter)

module.exports = router
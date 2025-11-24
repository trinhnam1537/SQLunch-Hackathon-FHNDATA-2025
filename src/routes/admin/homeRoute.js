const express = require('express')
const router = express.Router()
const homeController = require('../../app/controllers/admin/homeController')
const homePermission = require('../../app/middleware/checkPermission').homeClass

router.get('/', homePermission.read, homeController.show)
// router.get('/all/data/active-users', homePermission.read, homeController.getActiveUsersRealtime);

router.post('/data/finance'             , homeController.getFinance)
router.post('/data/orders'              , homeController.getOrders)
router.post('/data/customers'           , homeController.getCustomers)
router.post('/data/purchases'           , homeController.getPurchases)
router.post('/data/employees'           , homeController.getEmployees)
router.get('/data/brands'               , homeController.getBrands)
router.get('/data/products'             , homeController.getProducts)
router.get('/data/stores'               , homeController.getStores)
router.get('/data/suppliers'            , homeController.getSuppliers)
router.get('/data/user'                 , homeController.getUser)
router.get('/data/notification'         , homeController.getNotification)
router.post('/data/notification'        , homeController.setNotification)
router.post('/update/notification'      , homeController.updateNotification)
router.post('/update/all-notifications' , homeController.updateAllNotifications)

module.exports = router
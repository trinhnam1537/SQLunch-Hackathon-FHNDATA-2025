const express = require('express')
const router = express.Router()
const allOrderController = require('../../app/controllers/user/allOrderController')

router.get('/'                    , allOrderController.show)

router.get('/order/done'          , allOrderController.doneOrder)
router.get('/order/:id'           , allOrderController.orderInfo)
router.get('/order/rate/:id'      , allOrderController.rateOrder)
router.post('/order/rate/updated' , allOrderController.orderRated)
router.post('/order/updated'      , allOrderController.orderUpdated)

router.get('/checking'            , allOrderController.ordersChecking)

router.post('/create-orders'      , allOrderController.createOrders)
router.post('/payment'            , allOrderController.createPayment)

router.get('/callback'            , allOrderController.paymentResult)
router.post('/callback'           , allOrderController.paymentResult)

router.post('/data/order'         , allOrderController.getOrder)
router.post('/data/order-rated'   , allOrderController.getRatedOrder)
router.post('/data/voucher'       , allOrderController.getVoucher)
router.get('/data/all-vouchers'   , allOrderController.getAllVouchers)

module.exports = router
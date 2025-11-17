const express = require('express')
const router = express.Router()
const profileController= require('../../app/controllers/user/profileController')

router.get('/info'                , profileController.profileInfo)

router.post('/updated'            , profileController.profileUpdate)
router.post('/password-updated'   , profileController.passwordUpdate)
router.post('/order/updated'      , profileController.orderUpdate)

router.post('/data/user'          , profileController.getUser)
router.post('/data/orders'        , profileController.getOrders)
router.post('/data/done-orders'   , profileController.getDoneOrders)
router.post('/data/vouchers'      , profileController.getVouchers)
router.post('/data/user-vouchers' , profileController.getUserVouchers)

module.exports = router
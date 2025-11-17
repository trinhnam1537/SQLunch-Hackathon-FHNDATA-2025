const express = require('express')
const router = express.Router()
const allVouchersController = require('../../app/controllers/user/allVouchersController')

router.get('/voucher/:id'        , allVouchersController.voucherInfo)
router.get('/voucher/user/:id'   , allVouchersController.userVoucherInfo)
router.post('/data/voucher'      , allVouchersController.getVoucher)
router.post('/data/user-voucher' , allVouchersController.getUserVoucher)

module.exports = router
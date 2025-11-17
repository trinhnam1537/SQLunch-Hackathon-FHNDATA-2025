const express = require('express')
const router = express.Router()
const uVoucherController = require('../../app/controllers/admin/uVoucherController')
const uVoucherPermission = require('../../app/middleware/checkPermission').voucherClass

router.get('/'                 , uVoucherPermission.read   , uVoucherController.allVouchers)
router.get('/voucher/create'   , uVoucherPermission.create , uVoucherController.voucherCreate)
router.get('/voucher/:id'      , uVoucherPermission.update , uVoucherController.voucherInfo)

router.post('/voucher/created' , uVoucherController.voucherCreated)
router.put('/voucher/updated'  , uVoucherController.voucherUpdate)

router.post('/data/filter'     , uVoucherController.getFilter)
router.post('/data/vouchers'   , uVoucherController.getVouchers)
router.post('/data/members'    , uVoucherController.getMembers)
router.post('/data/voucher'    , uVoucherController.getVoucher)

module.exports = router
const express = require('express')
const router = express.Router()
const voucherController = require('../../app/controllers/admin/voucherController')
const voucherPermission = require('../../app/middleware/checkPermission').voucherClass

router.get('/'                 , voucherPermission.read   , voucherController.allVouchers)
router.get('/voucher/create'   , voucherPermission.create , voucherController.voucherCreate)
router.get('/voucher/:id'      , voucherPermission.update , voucherController.voucherInfo)

router.post('/voucher/created' , voucherController.voucherCreated)
router.put('/voucher/updated'  , voucherController.voucherUpdate)

router.post('/data/filter'     , voucherController.getFilter)
router.post('/data/vouchers'   , voucherController.getVouchers)
router.post('/data/members'    , voucherController.getMembers)
router.post('/data/voucher'    , voucherController.getVoucher)

module.exports = router
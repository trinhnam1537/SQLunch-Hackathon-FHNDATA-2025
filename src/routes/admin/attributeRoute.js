const express = require('express')
const router = express.Router()
const attributeController = require('../../app/controllers/admin/attributeController')
const attributePermission = require('../../app/middleware/checkPermission').attributeClass

router.get('/', attributePermission.read, attributeController.show)

router.get('/data/membership'     , attributeController.getMembership)
router.get('/data/order-status'   , attributeController.getOrderStatus)
router.get('/data/payment-method' , attributeController.getPaymentMethod)
router.get('/data/position'       , attributeController.getPosition)
router.get('/data/product-status' , attributeController.getProductStatus)

router.post('/create/membership'     , attributeController.createMembership)
router.post('/create/order-status'   , attributeController.createOrderStatus)
router.post('/create/payment-method' , attributeController.createPaymentMethod)
router.post('/create/position'       , attributeController.createPosition)
router.post('/create/product-status' , attributeController.createProductStatus)

router.put('/update/membership'     , attributeController.updateMembership)
router.put('/update/order-status'   , attributeController.updateOrderStatus)
router.put('/update/payment-method' , attributeController.updatePaymentMethod)
router.put('/update/position'       , attributeController.updatePosition)
router.put('/update/product-status' , attributeController.updateProductStatus)

router.delete('/delete/membership'     , attributeController.deleteMembership)
router.delete('/delete/order-status'   , attributeController.deleteOrderStatus)
router.delete('/delete/payment-method' , attributeController.deletePaymentMethod)
router.delete('/delete/position'       , attributeController.deletePosition)
router.delete('/delete/product-status' , attributeController.deleteProductStatus)

module.exports = router
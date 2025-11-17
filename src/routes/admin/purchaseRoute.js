const express = require('express')
const router = express.Router()
const purchaseController = require('../../app/controllers/admin/purchaseController')
const purchasePermission = require('../../app/middleware/checkPermission').purchaseClass

router.get('/'                  , purchasePermission.read   , purchaseController.allPurchases)
router.get('/purchase/create'   , purchasePermission.create , purchaseController.purchaseCreate)
router.get('/purchase/:id'      , purchasePermission.update , purchaseController.purchaseInfo)

router.post('/purchase/created' , purchaseController.purchaseCreated)
router.put('/purchase/updated'  , purchaseController.purchaseUpdate)

router.post('/data/purchases'   , purchaseController.getPurchases)
router.post('/data/purchase'    , purchaseController.getPurchase)
router.post('/data/filter'      , purchaseController.getFilter)
router.post('/data/suppliers'   , purchaseController.getSuppliers)
router.post('/data/materials'   , purchaseController.getMaterials)

module.exports = router
const express = require('express')
const router = express.Router()
const materialController = require('../../app/controllers/admin/materialController')
const materialPermission = require('../../app/middleware/checkPermission').materialClass

router.get('/'                  , materialPermission.read   , materialController.allMaterials)
router.get('/material/create'   , materialPermission.create , materialController.createMaterial)
router.get('/material/:id'      , materialPermission.update , materialController.materialInfo)

router.post('/material/created' , materialController.materialCreated)
router.put('/material/updated'  , materialController.materialUpdated)

router.post('/data/materials'   , materialController.getMaterials)
router.post('/data/material'    , materialController.getMaterial)
router.post('/data/filter'      , materialController.getFilter)

module.exports = router
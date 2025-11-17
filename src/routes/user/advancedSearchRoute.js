const express = require('express')
const router = express.Router()
const advancedSearchController = require('../../app/controllers/user/advancedSearchController')

router.get('/'               , advancedSearchController.show)

router.post('/data/brands'   , advancedSearchController.getBrands)
router.post('/data/products' , advancedSearchController.getProducts)

module.exports = router
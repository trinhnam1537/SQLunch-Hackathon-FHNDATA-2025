const express = require('express')
const router = express.Router()
const allBrandsController = require('../../app/controllers/user/allBrandsController')

router.get('/'                      , allBrandsController.showAllBrands)
router.get('/brand/:id'             , allBrandsController.brandInfo)

router.post('/data/brands'          , allBrandsController.getBrands)
router.post('/data/brand'           , allBrandsController.getBrand)
router.post('/data/related-products', allBrandsController.getRelatedProducts)

module.exports = router
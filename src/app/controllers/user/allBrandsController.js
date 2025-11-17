const brand = require('../../models/brandModel')
const product = require('../../models/productModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')

class allBrandsController {
  async getBrands(req, res, next) {
    try {
      const brands = await brand.find().lean()
      if (!brands) return res.json({message: 'brands not found'})
      return res.json({data: brands})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async getBrand(req, res, next) {
    try {
      const brandInfo =  await brand.findOne({ _id: req.body.id }).lean()
      if (!brandInfo) return res.json({message: 'brand not found'})
      return res.json({data: brandInfo})

    } catch (error) {
      return res.json({error: error})
    }
  }
  
  async getRelatedProducts(req, res, next) {
    try {
      const relatedProducts = await product.find({ brand: req.body.name })
      if (!relatedProducts) return res.json({message: 'products not found'})
      return res.json({data: relatedProducts})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async showAllBrands(req, res, next) {
    return res.render('users/allBrands', { title: 'Toàn bộ thương hiệu' }) 
  }

  async brandInfo(req, res, next) {
    if (!checkForHexRegExp(req.params.id)) return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    const holderRelatedProducts = Array(5).fill({})
    return res.render('users/detailBrand', { holderRelatedProducts })
  }
}
module.exports = new allBrandsController
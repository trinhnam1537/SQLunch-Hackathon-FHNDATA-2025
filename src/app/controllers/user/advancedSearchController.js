const brand = require('../../models/brandModel')
const product = require('../../models/productModel')

class advancedSearchController {
  async show(req, res, next) {
    return res.render('users/advancedSearch', { title: 'Tìm kiếm nâng cao' }) 
  }

  async getBrands(req, res, next) {
    try {
      const brands = await brand.find().lean()
      if (!brands) return res.json({message: 'brands not found'})
      return res.json({data: brands})

    } catch (error) {
      return res.json({error: error})
    } 
  }

  async getProducts(req, res, next) {
    try {
      const products = await product.find().lean()
      if (!products) return res.json({message: 'products not found'})
      return res.json({data: products})

    } catch (error) {
      return res.json({error: error})
    }
  }
}
module.exports = new advancedSearchController
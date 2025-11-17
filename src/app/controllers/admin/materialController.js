require('dotenv').config()
const material = require('../../models/materialModel')
const supplier = require('../../models/supplierModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')
const { ObjectId } = require('mongodb')

class allMaterialsController {
  // all
  async getMaterials(req, res, next) {
    try {
      const currentPage  = req.body.page
      const sort         = req.body.sort
      const filter       = req.body.filter
      const itemsPerPage = req.body.itemsPerPage
      const skip         = (currentPage - 1) * itemsPerPage

      if (filter['_id']) {
        filter['_id'] = ObjectId.createFromHexString(filter['_id'])
      }
  
      const [data, dataSize] = await Promise.all([
        material
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(itemsPerPage)
          .lean(),
        material.find(filter).countDocuments(),
      ]) 
      if (!data) throw new Error('Data not found')
      
      return res.json({data: data, data_size: dataSize})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async getFilter(req, res, next) {

  }

  async allMaterials(req, res, next) {
    try {
      return res.render('admin/all/material', { title: 'Danh sách nguyên liệu', layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  // update
  async getMaterial(req, res, next) {
    try {
      const materialInfo = await material.findOne({ _id: req.body.id }).lean()
      if (!materialInfo) throw new Error('Material not found')

      return res.json({materialInfo: materialInfo})
    } catch (error) {
      return res.json({error: error.message})
    }
  }

  async materialInfo(req, res, next) {
    try {
      if (!checkForHexRegExp(req.params.id)) throw new Error('error')
      if (!(await material.findOne({ _id: req.params.id }).lean())) throw new Error('error')

      return res.render('admin/detail/material', { layout: 'admin' })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' }) 
    }
  }

  async materialUpdated(req, res, next) {  
    try {
      function deFormatNumber(number) {
        return parseInt(number.replace(/\./g, ''))
      }

      const updatedMaterial = await material.findOneAndUpdate(
        { _id: req.body.id },
        {
          $set: {
            code           : req.body.code,
            name           : req.body.name,
            category       : req.body.category,
            description    : req.body.description,
            unit           : req.body.unit,
            quantity       : req.body.quantity,
            price          : deFormatNumber(req.body.price),
            supplierId     : req.body.supplierId,
            expiry_date    : req.body.expiry_date,
            certifications : req.body.certifications,
          }
        },
        { new: true }
      )

      // try {
      //   await producer.connect()
      //   await producer.send({
      //     topic: 'update',
      //     messages: [{ value: JSON.stringify({
      //       topic_type: 'product',
      //       emp_id: req.cookies.uid,
      //       body: updatedProduct
      //     })}],
      //   })
      // } catch (error) {
      //   console.log(error)
      // }
  
      return res.json({message: 'Cập nhật thông tin thành công'})
    } catch (error) {
      return res.json({error: error.message})
    }  
  }

  // create
  async createMaterial(req, res, next) {
    try {
      const suppliers = await supplier.find().lean()
      return res.render('admin/create/material', { title: 'Thêm nguyên liệu mới', layout: 'admin', suppliers })
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async materialCreated(req, res, next) {
    try {
      const newMaterial = new material({
        code          : req.body.code,
        name          : req.body.name,
        category      : req.body.category,
        description   : req.body.description,
        unit          : req.body.unit,
        quantity      : req.body.quantity,
        price         : req.body.price,
        supplierId    : req.body.supplierId,
        expiry_date   : req.body.expiry_date,
        certifications: req.body.certifications,
      })
      const savedMaterial = await newMaterial.save()

      // try {
      //   await producer.connect()
      //   await producer.send({
      //     topic: 'create',
      //     messages: [{ value: JSON.stringify({
      //       topic_type: 'product',
      //       emp_id: req.cookies.uid,
      //       body: savedProduct
      //     })}],
      //   })
      // } catch (error) {
      //   console.log(error)
      // }

      return res.json({isValid: true, message: 'Tạo nguyên liệu mới thành công'})
    } catch (error) {
      return res.json({error: error.message})
    }
  }
}
module.exports = new allMaterialsController
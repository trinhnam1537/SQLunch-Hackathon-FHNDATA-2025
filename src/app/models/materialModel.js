const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const material = new Schema({
  code         : { type: String, default: '' }, 
  name         : { type: String, default: '' }, 
  category     : { type: String, default: '' }, 
  description  : { type: String, default: '' },
  unit         : { type: String, default: '' },
  quantity     : { type: Number, default: 0 },
  price        : { type: Number, default: 0 },
  supplierId   : { type: String, default: '' },
  expiry_date  : { type: String, default: '' },
  certifications: { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('material', material, 'materials')
const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const supplier = new Schema({
  name      : { type: String, default: '' },
  phone     : { type: String, default: '' },
  email     : { type: String, unique: true },
  address   : { type: String, default: '' },
  quantity  : { type: Number, default: 0 },
  totalCost : { type: Number, default: 0 },
  slug      : { type: String, slug: 'name', unique: true },
}, { timestamps: true })
module.exports = mongoose.model('supplier', supplier)
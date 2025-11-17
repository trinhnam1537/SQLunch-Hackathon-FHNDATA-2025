const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const productStatus = new Schema({
  code : { type: String, default: 'normal', unique: true }, 
  name : { type: String, default: 'Bình thường' }, 
}, { timestamps: true })
module.exports = mongoose.model('productStatus', productStatus, 'productStatuses')
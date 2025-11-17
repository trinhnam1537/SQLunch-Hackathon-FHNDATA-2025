const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const paymentMethod = new Schema({
  code : { type: String, default: 'cash', unique: true }, 
  name : { type: String, default: 'Tiền mặt' }, 
}, { timestamps: true })
module.exports = mongoose.model('paymentMethod', paymentMethod, 'paymentMethods')
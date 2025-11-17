const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const brand = new Schema({
  name         : { type: String, default: '' }, 
  img          : { 
    path       : String,
    filename   : String,
  }, 
  totalProduct : { type: Number, default: 0 },
  totalRevenue : { type: Number, default: 0 },
}, { timestamps: true })
module.exports = mongoose.model('brand', brand)
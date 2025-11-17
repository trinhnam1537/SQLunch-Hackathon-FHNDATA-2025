const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const comment = new Schema({
  orderId   : { type: String, default: '' },
  productId : { type: String, default: '' },
  senderId  : { type: String, default: '' },
  comment   : { type: String, default: '' },
  rate      : { type: Number, default: 0 }
}, { timestamps: true })
module.exports = mongoose.model('comment', comment)
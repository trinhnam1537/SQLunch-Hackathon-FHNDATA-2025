const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const notification = new Schema({
  message     : { type: String , default: '' },
  receiverId  : { type: String , default: '' },
  isRead      : { type: Boolean, default: false},
  type        : { type: String , default: '' },
}, { timestamps: true })
module.exports = mongoose.model('notification', notification, 'notifications')
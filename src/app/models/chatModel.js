const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const chat = new Schema({
  adminId     : { type: String, default: '' }, 
  userId      : { type: String, default: '' }, 
  lastMessage : { type: String, default: '' }
}, { timestamps: true })
module.exports = mongoose.model('chat', chat)
const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const aiChat = new Schema({
  userId      : { type: String, default: '' }, 
  lastMessage : { type: String, default: '' }
}, { timestamps: true })
module.exports = mongoose.model('aiChat', aiChat, 'aiChats')
const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const chatEmp = new Schema({
  firstEmpID  : { type: String, default: '' }, 
  secondEmpID : { type: String, default: '' }, 
  lastMessage : { type: String, default: '' }
}, { timestamps: true })
module.exports = mongoose.model('chatEmp', chatEmp)
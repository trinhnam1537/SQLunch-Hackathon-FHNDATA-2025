const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const position = new Schema({
  code : { type: String, default: 'employee', unique: true }, 
  name : { type: String, default: 'Nhân viên' }, 
  wage : { type: Number, default: 5000000 }
}, { timestamps: true })
module.exports = mongoose.model('position', position)
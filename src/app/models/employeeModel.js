const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const employee = new Schema({
  email    : { type: String, unique: true },
  password : { type: String, default: ''},
  role     : { type: String, default: 'employee' },
  name     : { type: String, default: '' },
  phone    : { type: String, default: '' },
  dob      : { type: Date, default: null},
  gender   : { type: String, default: 'male' },
  address  : { type: String, default: '' },
  isActive  : { type: Boolean, default: false },
  slug      : { type: String, slug: 'name', unique: true },
}, { timestamps: true })
module.exports = mongoose.model('employee', employee)
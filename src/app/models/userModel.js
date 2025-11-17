const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const user = new Schema({
  email     : { type: String, unique: true },
  password  : { type: String, default: ''},
  role      : { type: String, default: 'user' },
  name      : { type: String, default: '' },
  phone     : { type: String, default: '' },
  gender    : { type: String, default: '' },
  address   : { type: String, default: '' },
  dob       : { type: Date, default: null},
  quantity  : { type: Number, default: 0 },
  revenue   : { type: Number, default: 0 },
  memberCode: { type: String, default: 'bronze'},
  isActive  : { type: Boolean, default: false },
  lastLogin : { type: Date, default: Date.now }, 
  favorites : {
    categories: {type: String, default: ''},
    skincare  : {type: String, default: ''},
    makeup    : {type: String, default: ''},
    brand     : {type: String, default: ''},
  },
  slug      : { type: String, slug: 'name', unique: true },
}, { timestamps: true })
module.exports = mongoose.model('user', user)
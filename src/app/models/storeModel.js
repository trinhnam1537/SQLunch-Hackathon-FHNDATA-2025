const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const store = new Schema({
  code     : { type: String, default: '', slug: 'name', unique: true},
  name     : { type: String, default: '' },
  address  : { type: String, default: '' },
  details  : { type: String, default: '' },
  revenue  : { type: Number, default: 0 },
}, { timestamps: true })
module.exports = mongoose.model('store', store)
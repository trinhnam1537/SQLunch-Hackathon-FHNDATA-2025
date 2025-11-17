const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const userVoucher = new Schema({
  userId      : { type: String},
  orderId     : { type: String},
  code        : { type: String, unique: true, required: true },
  description : { type: String, default: '' },
  voucherType : { type: String, enum: ['order', 'birthday'], default: 'order' },
  discount    : { type: Number, default: 0 },
  minOrder    : { type: Number, default: 0 },
  status      : { type: String, enum: ['active', 'used', 'expired'], default: 'active' },
  startDate   : { type: Date, default: Date.now },
  endDate     : { type: Date, required: true },
  usedAt      : { type: Date, default: null },
}, { timestamps: true })
module.exports = mongoose.model('userVoucher', userVoucher, 'userVouchers')
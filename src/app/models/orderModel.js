const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)
const Schema = mongoose.Schema
const order = new Schema({
  products: [
    {
      id         : { type: String, default: '' },
      image      : { type: String, default: '' },
      name       : { type: String, default: '' },
      price      : { type: Number, default: 0 },
      quantity   : { type: Number, default: 0 },
      totalPrice : { type: Number, default: 0 }
    }
  ],
  customerInfo: {
    userId  : { type: String, default: '' },
    name    : { type: String, default: '' },
    phone   : { type: String, default: '' },
    address : { type: String, default: '' },
    note    : { type: String, default: '' }
  },
  totalOrderPrice    : { type: Number , default: 0 },
  totalNewOrderPrice : { type: Number , default: 0 },
  paymentMethod      : { type: String , default: '' },
  status             : { type: String , default: 'pending' },
  isRated            : { type: Boolean, default: false},
  isPaid             : { type: Boolean, default: false},
  voucherCode        : { type: String , default: '' },
  deletedAt          : { type: Date   , default: null }
}, { timestamps: true })
module.exports = mongoose.model('order', order)
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userView = new Schema({
  userId    : { type: String, default: '' },
  productId : { type: String, default: '' },
  viewCount : { type: Number, default: 0  },
  lastViewAt: { type: Date, default: Date.now},
}, { timestamps: true })

module.exports = mongoose.model('userView', userView, 'userViews')

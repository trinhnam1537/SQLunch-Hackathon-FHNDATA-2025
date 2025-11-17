const voucher = require('../../models/voucherModel')
const userVoucher = require('../../models/userVoucherModel')
const checkForHexRegExp = require('../../middleware/checkForHexRegExp')

class allVouchersController {
  async voucherInfo(req, res, next) {
    if (!checkForHexRegExp(req.params.id)) return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    return res.render('users/detailVoucher', { title: 'Voucher' })
  }

  async userVoucherInfo(req, res, next) {
    if (!checkForHexRegExp(req.params.id)) return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    return res.render('users/detailUserVoucher', { title: 'Voucher' })
  }

  async getVoucher(req, res, next) {
    try {
      const voucherInfo = await voucher.findOne({ _id: req.body.id }).lean()
      if (!voucherInfo) throw Error('voucher not found')
      return res.json({data: voucherInfo})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async getUserVoucher(req, res, next) {
    try {
      const userVoucherInfo = await userVoucher.findOne({ _id: req.body.id }).lean()
      if (!userVoucherInfo) throw Error('voucher not found')
      return res.json({data: userVoucherInfo})

    } catch (error) {
      return res.json({error: error})
    }
  }
}
module.exports = new allVouchersController
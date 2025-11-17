const userVoucher = require('../../models/userVoucherModel')
const voucher = require('../../models/voucherModel')

async function setVoucherExpired() {
  console.log("Running setExpiredVouchers cron...")
  const now = new Date()
  await userVoucher.updateMany({ endDate: { $lt: now } }, { status: 'expired' })
  await voucher.updateMany({ endDate: { $lt: now } }, { status: 'expired' })
  console.log("Expired vouchers updated successfully.")
}

module.exports = { setVoucherExpired }
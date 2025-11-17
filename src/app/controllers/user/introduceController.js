class introduceController {
  show(req, res, next) { 
    return res.render('users/introduce', { title: 'Giới thiệu về Cosmetic Garden' })
  }
}
module.exports = new introduceController
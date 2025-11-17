const express = require('express')
const router = express.Router()
const emp = require('../../app/models/employeeModel')

router.get('/', async function(req, res) {
  res.clearCookie('rt', {
    httpOnly: true,
    secure: true,
  })
  res.clearCookie('uid', {
    httpOnly: true,
    secure: true,
  })
  await emp.updateOne({_id: req.cookies.uid}, {
    isActive: false
  })
  res.redirect('/emp/authentication/sign-in')
})

module.exports = router
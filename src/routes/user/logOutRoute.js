const express = require('express')
const router = express.Router()
const user = require('../../app/models/userModel')

router.get('/', async function(req, res) {
  res.clearCookie('rt', {
    httpOnly: true,
    secure: true,
  })
  res.clearCookie('uid', {
    httpOnly: true,
    secure: true,
  })
  await user.updateOne({_id: req.cookies.uid}, {
    isActive: false
  })
  
  res.redirect('/authentication/sign-in')
})

module.exports = router
const express = require('express')
const router = express.Router()
const introduceController = require('../../app/controllers/user/introduceController')

router.get('/', introduceController.show)

module.exports = router
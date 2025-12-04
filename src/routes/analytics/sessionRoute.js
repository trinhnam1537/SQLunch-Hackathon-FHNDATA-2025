const express = require('express')
const router = express.Router()
const homeController = require('../../app/controllers/admin/homeController')

router.post('/session-kpis', homeController.getSessionKPIs)

module.exports = router

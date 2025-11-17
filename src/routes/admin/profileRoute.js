const express = require('express')
const router = express.Router()
const profileController = require('../../app/controllers/admin/profileController')

router.get('/'             , profileController.updateProfile)
router.put('/updated'      , profileController.profileUpdated)

router.post('/data/profile', profileController.getProfile)

module.exports = router
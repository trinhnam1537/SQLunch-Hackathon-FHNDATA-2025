const express = require('express')
const router = express.Router()
const chatEmpController = require('../../app/controllers/admin/chatEmpController')
const chatEmpPermission = require('../../app/middleware/checkPermission').chatEmpClass

router.get('/'                  , chatEmpPermission.read   , chatEmpController.allChats)
router.post('/create'           , chatEmpPermission.create , chatEmpController.chatCreated)
router.get('/:id'               , chatEmpPermission.update , chatEmpController.chatInfo)

router.post('/get-last-message' , chatEmpController.chatLastMessage)
router.get('/data/chats'        , chatEmpController.getChats)
router.get('/data/user'         , chatEmpController.getUser)

module.exports = router
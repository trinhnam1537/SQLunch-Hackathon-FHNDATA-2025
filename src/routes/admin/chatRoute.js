const express = require('express')
const router = express.Router()
const chatController = require('../../app/controllers/admin/chatController')
const chatPermission = require('../../app/middleware/checkPermission').chatClass

router.get('/'                  , chatPermission.read   , chatController.allChats)
router.post('/create'           , chatPermission.create , chatController.chatCreated)
router.get('/:id'               , chatPermission.update , chatController.chatInfo)

router.post('/get-last-message' , chatController.chatLastMessage)
router.get('/data/chats'        , chatController.getChats)
router.get('/data/user'         , chatController.getUser)

module.exports = router
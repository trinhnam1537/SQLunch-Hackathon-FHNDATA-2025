require('dotenv').config()
const express = require('express')
const router = express.Router()
const chat = require('../../app/models/chatModel')
const aiChat = require('../../app/models/aiChatModel')
const message = require('../../app/models/messageModel')

router.use(express.json())
router.get('/:id', async function(req, res) {
  const chatRoom = await chat.findOne({ userId: req.params.id }).lean()
  if (!chatRoom) return res.json({data: []})

  const chatMessages = await message.find({ chatId: chatRoom._id }).sort({createdAt: 1}).lean()
  return res.json({data: chatMessages})
})
router.post('/create', async function(req, res) {
  const chatRoom = await chat.findOne({ userId: req.cookies.uid }).lean()
  const newMessage = new message({
    chatId  : chatRoom._id,
    senderId: req.cookies.uid,
    content : req.body.value
  })
  await chat.updateOne({_id: chatRoom._id}, {
    updatedAt   : new Date(),
    lastMessage : req.body.value
  })
  await newMessage.save()
  return res.json({message: 'save successfully'})
})
router.get('/ai/:id', async function(req, res) {
  const chatRoom = await aiChat.findOne({ userId: req.params.id }).lean()
  if (!chatRoom) return res.json({data: []})

  const chatMessages = await message.find({ chatId: chatRoom._id }).sort({createdAt: 1}).lean()
  return res.json({data: chatMessages})
})
router.get('/ai/:id', async function(req, res) {
  const chatRoom = await aiChat.findOne({ userId: req.params.id }).lean()
  if (!chatRoom) return res.json({data: []})

  const chatMessages = await message.find({ chatId: chatRoom._id }).sort({createdAt: 1}).lean()
  return res.json({data: chatMessages})
})
router.post('/ai/create', async function(req, res) {
  console.log(req.body.prompt)
  const key = process.env.GEMINI_API_KEY
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: req.body.prompt}]
        }
      ]
    })
  })

  const json = await response.json()
  console.log(json)
  const answer = json.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response at this time.'

  const chatRoom = await aiChat.findOne({ userId: req.cookies.uid }).lean()
  const newMessage = new message({
    chatId: chatRoom._id,
    senderId: req.cookies.uid,
    content: req.body.prompt
  })
  const newAnswer = new message({
    chatId: chatRoom._id,
    senderId: 'gemini',
    content: answer
  })
  await newMessage.save()
  await newAnswer.save()
  return res.json({answer: answer})
})

module.exports = router
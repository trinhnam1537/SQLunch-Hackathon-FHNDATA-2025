const chat = require('../../models/chatModel')
const user = require('../../models/userModel')
const emp  = require('../../models/employeeModel')
const message = require('../../models/messageModel')

class allChatsController {
  async getChats(req, res, next) {
    try {
      
    } catch (error) {
      
    }
  }

  async getUser(req, res, next) {
    try {
      const empInfo = await emp.findOne({ _id: req.cookies.uid }).lean()
      if (!empInfo) throw new Error('User not found')
  
      return res.json({message: empInfo._id})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async allChats(req, res, next) {
    try {
      const uid = req.cookies.uid
    
      const [chats, totalChat] = await Promise.all([
        chat.aggregate([
          {
            $lookup: {
              from: "employees",  // The collection to join (table2)
              let: { userIdStr: "$userId" },  // Define a variable for userId
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ["$_id", { $toObjectId: "$$userIdStr" }]  // Match _id with converted userId
                    }
                  }
                }
              ],
              as: "userInfo"  // Name of the joined data field
            }
          },
          {
            $unwind: "$userInfo"  // Flatten the array (optional)
          },
          {
            $sort: { updatedAt: -1 }
          }
        ]),
        emp.find().countDocuments(),
      ])
  
      return res.render('admin/all/chat', { title: 'Chat', layout: 'admin', uid, chats, totalChat })
      
    } catch (error) {
      return res.status(403).render('partials/denyUserAccess', { title: 'Not found', layout: 'empty' })
    }
  }

  async chatInfo(req, res) {
    try {
      const userId = req.params.id
      const userStatus = await user.findOne({ _id: userId }).lean()
      if (!userStatus) throw new Error('User not found')

      const chatRoom = await chat.findOne({ userId: userId }).lean()
      if (!chatRoom) throw new Error('Chat room not found')

      const chatMessages = await message.find({ chatId: chatRoom._id }).sort({createdAt: 1}).lean()
      if (!chatMessages) throw new Error('Chat messages not found')

      return res.json({data: chatMessages, chatId: chatRoom._id, userStatus: userStatus.isActive})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }

  async chatCreated(req, res) {
    try {
      const newMessage = new message({
        chatId: req.body.chatId,
        senderId: req.cookies.uid,
        content: req.body.value
      })
      await chat.updateOne({_id: req.body.chatId}, {
        updatedAt: new Date(),
        lastMessage: req.body.value
      })
      await newMessage.save()
      return res.json({message: 'save successfully'})

    } catch (error) {
      return res.json({error: error})
    }
  }

  async chatLastMessage(req, res) {
    try {
      const chatInfo = await chat.findOne({ userId: req.body.userId}).lean()
      if (!chatInfo) throw new Error('Chat not found')

      return res.json({lastMessage: chatInfo.lastMessage})
    } catch (error) {
      console.log(error)
      return res.json({error: error.message})
    }
  }
}
module.exports = new allChatsController
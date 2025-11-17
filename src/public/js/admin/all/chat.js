importLinkCss('/css/admin/all/chats.css')

const chatContent = document.querySelector('div.chat-content')
const input       = document.querySelector('textarea.input')
const chatSearch  = document.querySelector('input.chat-search')
const sendBtn     = document.querySelector('div.send-btn')
const form        = document.querySelector('form.input-form')
const chatList    = document.querySelector('div.chat-list').querySelectorAll('div.item')
const userChatId  = {id: ''}
const adminId     = {id: ''}

getUser()

chatList.forEach(chat => {
  const time = chat.querySelector('div.time').textContent
  chat.querySelector('div.time').textContent = formatDate(time)
})

async function getUser() {
  try {
    const response = await fetch('/admin/all-chats/data/user')
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {message, error} = await response.json()
    if (error) return pushNotification(error)

    adminId.id = message
  } catch (error) {
    console.error("Error fetching chat data:", error)
  }
}

async function getChatData(adminId, userId, userName, chatContent) {
  try {
    const response = await fetch(`/admin/all-chats/${userId}`)
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const {data, userStatus, chatId, error} = await response.json()
    if (error) return pushNotification(error)

    userChatId.id = chatId 
    
    const chatHeader = document.querySelector('div.chat-body').querySelector('div.chat-header')
    chatHeader.querySelector('div.name').textContent = userName
    chatHeader.querySelector('div.last-active').textContent = userStatus ? 'Active now' : 'Offline'
    chatHeader.style.opacity = 1

    const ul = document.createElement('ul')
    chatContent.replaceChildren()
    chatContent.appendChild(ul)

    data.forEach((message) => {
      appendMessage(ul, message.content, message.senderId, message.createdAt, adminId)
    })
  } catch (error) {
    console.error("Error fetching chat data:", error)
  }
}

function checkCurrentIndex(index) {
  chatList.forEach((item, i) => {
    if (i === index) item.classList.add('active')
    else item.classList.remove('active')
  })
}

async function appendMessage(ul, msg, senderId, createdAt, adminId) {
  const chat = document.createElement('li')
  const date = document.createElement('li')

  chat.textContent = msg
  date.textContent = formatDateTime(createdAt)
  date.style.display = 'none'

  chat.onclick = function() {
    date.style.display === 'none' ? date.style.display = 'block' : date.style.display = 'none'
  }

  if (senderId === adminId) {
    chat.setAttribute('class', 'right-content')
    date.setAttribute('class', 'right-date')
  } else {
    date.setAttribute('class', 'left-date')
  }

  ul.appendChild(chat)
  ul.appendChild(date)
  chatContent.scrollTo(0, chatContent.scrollHeight)
}

async function reOrderChatSidebar(id, msg, room) {
  for (const chat of chatList) {
    if (chat.id === room) { 
      const parent = chat.parentElement
      if (parent) parent.prepend(chat)

      const lastMessageElement = chat.querySelector('div.last-message')
      lastMessageElement.textContent = msg
      if (id !== adminId.id) lastMessageElement.style.fontWeight = 'bold'

      break // Stop loop after finding the chat
    }
  }
}

chatSearch.addEventListener('input', function() {
  chatList.forEach(item => {
    const name = item.querySelector('div.name')?.textContent.trim().toLowerCase()
    const searchValue = chatSearch.value.trim().toLowerCase()

    if (!name.includes(searchValue)) {
      item.style.display = 'none'
    } else {
      item.style.display = ''
    }
  })
})

chatList.forEach((chat, index) => {
  chat.onclick = function() {
    const userId = chat.id
    const userName = chat.querySelector('div.name').textContent
    const lastMessage = chat.querySelector('div.last-message')
    if (lastMessage.style.fontWeight === 'bold') lastMessage.style.fontWeight = ''
    input.id = userId
    getChatData(adminId.id, userId, userName, chatContent)
    checkCurrentIndex(index)
  }
})

sendBtn.onclick = async function() {
  if (input.value.trim() !== '') {
    socket.emit('privateMessage', { room: input.id, message: `${adminId.id}:${input.value}` })
    const response = await fetch('/admin/all-chats/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({value: input.value, chatId: userChatId.id})
    })
    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    input.value = ''
    sendBtn.classList.add('not-allowed')
    chatContent.scrollTo(0, chatContent.scrollHeight)
  }
}

input.addEventListener('input', function() {
  if (input.value.trim() !== '') sendBtn.classList.remove('not-allowed') 
  else sendBtn.classList.add('not-allowed')
})

input.addEventListener("keypress", function(event) {
  if (event.key === "Enter" && input.value.trim() !== '') {
    sendBtn.click()
    input.value = ''
    sendBtn.classList.add('not-allowed')
  }
})

socket.on('chat-message', (id, msg, room) => {
  const ul = chatContent.querySelector('ul')
  appendMessage(ul, msg, id, new Date(), adminId.id)
  reOrderChatSidebar(id, msg, room)
})
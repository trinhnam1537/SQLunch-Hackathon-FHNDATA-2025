window.recommend_url = 'https://cosmetic-garden-recommendation.onrender.com'
const socket = io("https://cosmetic-garden-chat.onrender.com", {path: "/socket.io"})

setInterval(async function () {
  socket.emit('heartbeat', { message: 'user ping' })
  await fetch(window.recommend_url, {
    method: 'GET',
    headers: {'Content-Type': 'application/json'},
  })
}, 30000) // Send a ping every 30 seconds

window.addEventListener('load', () => {
  const preloader = document.querySelector('div.preloader')
  preloader.classList.add('inactive')
})
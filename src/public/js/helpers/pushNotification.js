async function pushNotification(message) {
  if (message) {
    var body = document.querySelector('body')
    var notification = document.createElement('div')
    notification.setAttribute('class', 'notification')
    notification.textContent = message
    body.append(notification)
  }
}
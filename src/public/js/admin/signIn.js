importLinkCss('/css/layouts/signIn.css')
import { permissions, menuConfig } from '../helpers/permission.js'

async function checkingAccount() {
  document.querySelector('button').classList.add('loading')

  const email = document.querySelector('input#email').value
  const password = document.querySelector('input#password').value
  const response = await fetch("/emp/authentication/checking-account", {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {isValid, message, role} = await response.json()

  document.querySelector('button').classList.remove('loading')
  
  if (!isValid) {
    document.querySelector('p.wrong-info').textContent = message
    document.querySelector('p.wrong-info').style.color = 'red'
    return 
  }
  
  if (!role) {
    pushNotification('Something went wrong. Please try again!')
    return
  }

  document.querySelector('p.wrong-info').textContent = ''
  pushNotification(message)

  function getRedirectUrlByRole(role) {
    for (const item of menuConfig) {
      if (permissions[item.permission].includes(role)) {
        return item.href
      }
    }
    return "/403" // fallback if no permission
  }

  const redirectUrl = getRedirectUrlByRole(role)

  setTimeout(() => {
    const path = window.location.origin
    window.location.replace(path + redirectUrl)
  }, 1000)
  
  return
}

// validator({
//   form: '#form-1',
//   errorSelector: '.form-message',
//   rules: [
//     isEmail('#email'),
//     isRequiredString('#password'),
//   ]
// }, 2)

document.querySelector("form").addEventListener("submit", function(event) {
  event.preventDefault() // Prevents form submission
  checkingAccount()
})
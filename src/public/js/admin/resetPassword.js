importLinkCss('/css/user/resetPassword.css')

const form              = document.querySelector('form#form-5') 
const submitButton      = document.querySelector('button')
const resetPasswordContainer = document.querySelector('div.reset-password-container')
const messageElement    = document.querySelector('span.message')
const inputEmail        = document.querySelector('input[name="email"]')

if (error) formatMessage(error, 'red')

function formatMessage(message, color) {
  messageElement.innerText = message
  messageElement.style.color = color
}

async function verifyingEmail(email) {
  const response = await fetch("/emp/authentication/reset-password/verifying-email", {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: email,
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message} = await response.json()
  return message
}

async function verifyingCode(email, code) {
  const response = await fetch('/emp/authentication/reset-password/verifying-code', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: email,
      code : code
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message} = await response.json()
  return message
}

async function resettingPassword(email, password) {
  const response = await fetch('/emp/authentication/resetting-password', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email    : email,
      password : password
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {message} = await response.json()
  return message
}

// when submit, the form will push the input value from user to the URL for backend
submitButton.onclick = async function() {
  form.onsubmit = function (e) { e.preventDefault() }
  submitButton.classList.add('loading')
  console.log(submitButton.className)
  if (submitButton.className.includes('submit-email')) {
    const email = document.querySelector('input[name="email"]').value
    const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if (regex.test(email)) {
      const isVerify = await verifyingEmail(email)
      if (isVerify) {
        inputEmail.setAttribute('disabled', true)

        const inputCode = document.createElement('input')
        inputCode.type  = 'text'
        inputCode.placeholder = 'Nhập mã xác nhận'
        inputCode.name  = 'code'

        document.querySelector('div.input').appendChild(inputCode)

        submitButton.innerText = 'Gửi mã xác nhận'
        submitButton.className = 'submit-code'

        formatMessage('Nhập mã được gửi tới email để tiến hành thay đổi mật khẩu', 'green')
      }
      else {
        // if not matched, prevent submit, enter again
        formatMessage('Email chưa đăng ký tài khoản', 'red')
      }
    }
    else {
      // if not matched, prevent submit, enter again
      formatMessage('Email nhập chưa đúng', 'red')
    }
    submitButton.classList.remove('loading')
    return
  }

  if (submitButton.className.includes('submit-code')) {
    const email = document.querySelector('input[name="email"]').value
    const code  = document.querySelector('input[name="code"]').value
    const isVerify = await verifyingCode(email, code)
    if (isVerify) {
      form.querySelector('input[name="code"]').remove()

      const inputPassword = document.createElement('input')
      inputPassword.type  = 'password'
      inputPassword.placeholder = 'Nhập mật khẩu mới'
      inputPassword.name  = 'password'

      const inputConfirmPassword = document.createElement('input')
      inputConfirmPassword.type  = 'password'
      inputConfirmPassword.placeholder = 'Xác nhận mật khẩu mới'
      inputConfirmPassword.name  = 'confirm-password'

      document.querySelector('div.input').appendChild(inputPassword)
      document.querySelector('div.input').appendChild(inputConfirmPassword)
      
      submitButton.innerText = 'Xác nhận'
      submitButton.className = 'submit-password'
      formatMessage('Nhập mật khẩu mới', 'green')
    }
    else {
      // if not matched, prevent submit, enter again
      formatMessage('Mã xác nhận không đúng', 'red')
    }
    submitButton.classList.remove('loading')
    return
  }

  if (submitButton.className.includes('submit-password')) {
    const email     = document.querySelector('input[name="email"]').value
    const password  = document.querySelector('input[name="password"]').value
    const isSuccessful = await resettingPassword(email, password)
    if (isSuccessful) {
      window.location.replace(window.location.origin + '/emp/authentication/sign-in')
    } 
    submitButton.classList.remove('loading')
    return
  }
}
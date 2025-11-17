// executing validate
function validating(inputElement, rule, checkValidate, index) {
  var errorMessage = rule.test(inputElement.value)
  var errorElement = inputElement.parentElement.querySelector('.form-message')

  if (errorMessage) {
    errorElement.innerText = errorMessage
    inputElement.style.border = '2px solid red'
    inputElement.parentElement.style.color = 'red'
    checkValidate[index] = false
  } else {
    errorElement.innerText = ''
    inputElement.style.border = '1px solid #389845'
    inputElement.parentElement.style.color = 'black'
    checkValidate[index] = true
  }
}  

function isRequiredString(selector) {  
  return {
    selector: selector,
    test: function (value) {
      return value.trim() ? undefined : 'Chưa nhập rùiii'
    }
  }
}

function isRequiredNumber(selector) {
  return {
    selector: selector,
    test: function (value) {
      return value > 0 ? undefined : 'Chưa Nhập Tiền Kìa =((('
    }
  }
}

function isEmail(selector) {
  return {
    selector: selector,
    test: function (value) {
      var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
      return regex.test(value) ? undefined : 'Email nhập chưa đúng'
    }
  }
}

function isConfirmPassword(selector, getPasswordValue) {
  return {
    selector: selector,
    test: function (value) {
      return (value === getPasswordValue() && value !== '') ? undefined : "Mật Khẩu Chưa Trùng Rồi"
    }
  }
}

function validator(options, number) {
  const formElement = document.querySelector(options.form)
  const checkValidate = Array(number).fill(false)

  options.rules.forEach(function (rule, index) {
    const inputElement = formElement.querySelector(rule.selector)
    // input blur
    inputElement.onblur = function () {
      validating(inputElement, rule, checkValidate, index)
    }
  })

  formElement.onsubmit = function (e) {
    for (var i = 0; i < checkValidate.length; ++i) {
      if(!checkValidate[i]) {
        e.preventDefault()
        options.rules.forEach(function (rule, index) {
          const inputElement = formElement.querySelector(rule.selector)
          validating(inputElement, rule, checkValidate, index)
        })
        break
      } 
    }
  }
}
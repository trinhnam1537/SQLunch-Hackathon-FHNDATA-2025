importLinkCss('/css/admin/detail/customer.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getCustomer() {
  const response = await fetch('/admin/all-customers/data/customer', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, customerInfo, memberInfo, orderInfo} = await response.json()
  if (error) return pushNotification('Có lỗi xảy ra')

  document.title = customerInfo.name

  document.querySelector('input#id').value       = customerInfo._id || ''
  document.querySelector('input#name').value     = customerInfo.name || ''
  document.querySelector('input#email').value    = customerInfo.email || ''
  document.querySelector('input#phone').value    = customerInfo.phone || ''
  document.querySelector('input#address').value  = customerInfo.address || ''
  document.querySelector('input#dob').value      = customerInfo.dob === null ? null : customerInfo.dob.split('T')[0] 
  document.querySelectorAll('input[name="gender"]').forEach((input) => {
    if (input.value === customerInfo.gender) input.checked = true
  })
  document.querySelector('input#quantity').value = customerInfo.quantity || ''
  document.querySelector('input#revenue').value  = formatNumber(customerInfo.revenue) || ''
  document.querySelector('input#member').value   = memberInfo.name || ''

  let productIndex = 1
  orderInfo.forEach((order) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>${productIndex}</td>
      <td>${formatNumber(order.totalOrderPrice)}</td>
      <td>${order.paymentMethod.name}</td>
      <td>${order.orderStatus.name}</td>
      <td><a href="/admin/all-orders/order/${order._id}">Xem</a></td>
    `
    productIndex++
    document.querySelector('table#table-2').querySelector('tbody').appendChild(tr)
  })

  return customerInfo
}

async function updateCustomer(customerInfo) {
  const name    = document.querySelector('input#name').value
  const phone   = document.querySelector('input#phone').value
  const address = document.querySelector('input#address').value
  const dob     = document.querySelector('input#dob').value
  const gender  = document.querySelector('input[name="gender"]:checked').value

  const initialDob = customerInfo.dob === null ? null : customerInfo.dob.split('T')[0] 

  if (
    name    === customerInfo.name    &&
    phone   === customerInfo.phone   &&
    address === customerInfo.address &&
    gender  === customerInfo.gender  &&
    dob     === initialDob
  ) return pushNotification('Hãy cập nhật thông tin')

  document.querySelector('button[type="submit"]').classList.add('loading')
  const response = await fetch('/admin/all-customers/customer/updated', {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      id      : urlSlug,
      name    : name,
      phone   : phone,
      address : address,
      dob     : dob,
      gender  : gender
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error, message} = await response.json()

  if (error) {
    document.querySelector('button[type="submit"]').classList.remove('loading')
    pushNotification(error)
    return
  }  

  pushNotification(message)
  setTimeout(() => window.location.reload(), 3000)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    const customerInfo = await getCustomer()

    document.querySelector('button[type="submit"]').onclick = function() {
      updateCustomer(customerInfo)
    }
  } catch (error) {
    console.error('Có lỗi xảy ra:', error)
    pushNotification('Có lỗi xảy ra')
  }
})
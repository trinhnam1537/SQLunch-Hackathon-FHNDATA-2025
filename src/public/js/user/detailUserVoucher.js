importLinkCss('/css/user/detailVoucher.css')

const urlSlug = location.href.match(/([^\/]*)\/*$/)[1]

async function getUserVoucher() {
  const response = await fetch('/all-vouchers/data/user-voucher', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({id: urlSlug})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data} = await response.json()

  document.querySelector('td#code').textContent         = data.code || ''
  document.querySelector('td#description').textContent  = data.description || ''
  document.querySelector('td#voucherType').textContent  = data.voucherType || ''
  document.querySelector('td#discount').textContent     = formatNumber(data.discount) || ''
  document.querySelector('td#minOrder').textContent     = formatNumber(data.minOrder) || ''
  document.querySelector('td#status').textContent       = data.status || ''
  document.querySelector('td#startDate').textContent    = formatDate(data.startDate) || ''
  document.querySelector('td#endDate').textContent      = formatDate(data.endDate) || ''

  return
}

async function loadData(retriesLeft) {
  try {
    getUserVoucher()
  } catch (err) {
    if (retriesLeft > 1) {
      console.error(`Retrying... Attempts left: ${retriesLeft - 1}`)
      pushNotification('Error loading data. Retrying...')
      window.setTimeout(async function() {
        loadData(retriesLeft - 1)
      }, 2000)
    } else {
      console.error("Failed to fetch products after multiple attempts:", err)
      pushNotification(`Error loading data: ${err}. Please try again later`)
    }
  }
}

loadData(5)
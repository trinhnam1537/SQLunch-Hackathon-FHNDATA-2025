importLinkCss('/css/admin/all/userVouchers.css')

const tbody         = document.querySelector('table').querySelector('tbody')
const thead         = document.querySelector('table').querySelector('thead')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="userId" checked> Mã khách hàng</label>
    <label><input type="checkbox" value="orderId"> Mã đơn hàng</label>
    <label><input type="checkbox" value="code"> Mã giảm giá</label>
    <label><input type="checkbox" value="description" checked> Mô tả</label>
    <label><input type="checkbox" value="voucherType" checked> Loại voucher</label>
    <label><input type="checkbox" value="discount"> Mức giảm giá</label>
    <label><input type="checkbox" value="minOrder"> Đơn tối thiểu</label>
    <label><input type="checkbox" value="status"> Tình trạng</label>
    <label><input type="checkbox" value="startDate" checked> Ngày bắt đầu</label>
    <label><input type="checkbox" value="endDate"> Ngày kết thúc</label>
    <label><input type="checkbox" value="usedAt"> Ngày sử dụng</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  // const response = await fetch('/admin/all-u-vouchers/data/filter', {
  //   method: 'POST',
  //   headers: {'Content-Type': 'application/json'},
  // })
  // if (!response.ok) throw new Error(`Response status: ${response.status}`)
  // const json = await response.json()
  // if (json.error) return pushNotification(error)
  
  // json.memberShip.forEach((element, index) => {
  //   const option = document.createElement('option')
  //   option.value = element.code
  //   option.textContent = element.name
  //   document.querySelector('select#memberCode').appendChild(option)
  // })
}

async function getVouchers(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const payload = {
    page: currentPage,
    itemsPerPage: itemsPerPage,
    sort: sortOptions,
    filter: filterOptions
  }

  if (searchInput.value.trim()) payload.searchQuery = searchInput.value.trim()

  const response = await fetch('/admin/all-u-vouchers/data/vouchers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Voucher: ' + dataSize.size

  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked')).map(cb => ({
    value: cb.value,
    name: cb.closest("label").innerText.trim()
  }))

  selected.forEach(col => {
    const th = document.createElement('td')
    th.textContent = col.name
    trHead.appendChild(th)
  })

  const thAction = document.createElement('td')
  thAction.textContent = 'Actions'
  trHead.appendChild(thAction)
  thead.appendChild(trHead)

  // Rebuild TBODY
  tbody.querySelectorAll('tr').forEach(tr => tr.remove())

  data.forEach((item, index) => {
    const rowIndex = index + (currentPage - 1) * itemsPerPage + 1
    const tr = document.createElement('tr')

    const tdNo = document.createElement('td')
    tdNo.textContent = rowIndex
    tr.appendChild(tdNo)

    selected.forEach(col => {
      const td = document.createElement('td')
      let value = item[col.value] ?? ''

      if (['discount', 'minOrder'].includes(col.value)) {
        td.textContent = formatNumber(value)
        td.style.textAlign = 'right'
      }
      else if (['startDate', 'endDate', 'usedAt'].includes(col.value)) {
        td.textContent = value ? formatDate(value) : '-'
        td.style.textAlign = 'right'
      }
      else {
        td.textContent = value
      }

      tr.appendChild(td)
    })

    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `<button class="view-btn" title="View details"><i class="fi fi-rr-eye"></i></button>`
    tdAction.onclick = () => openVoucherDetail(item._id)
    tr.appendChild(tdAction)

    const headData = document.createElement('td')
    headData.textContent = 'STT'
    trHead.appendChild(headData)

    selected.forEach(col => {
      const td = document.createElement("td")
      td.textContent = col.name
      trHead.appendChild(td)
    })

    const headLink = document.createElement('td')
    headLink.textContent = 'Chi tiết'
    trHead.appendChild(headLink)

    thead.appendChild(trHead)

    // body
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    let itemIndex = (currentPage - 1) * itemsPerPage + 1

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')

      const itemData = document.createElement('td')
      itemData.textContent = itemIndex
      newTr.appendChild(itemData)

      selected.forEach(col => {
        const td = document.createElement("td")
        td.textContent = item[col.value]

        // voucherType
        // discount
        // minOrder
        // startDate
        // endDate
        // usedAt

        if (['discount', 'minOrder', 'startDate', 'endDate', 'usedAt'].includes(col.value) ) td.style.textAlign = 'right'
        if (['discount', 'minOrder'].includes(col.value)) td.textContent = formatNumber(item[col.value])
        if (['voucherType'].includes(col.value)) td.textContent = item[col.value] === 'order' ? 'Đặt đơn' : 'Sinh nhật'
        if (['startDate', 'endDate', 'usedAt'].includes(col.value)) td.textContent = formatDate(item[col.value])

        newTr.appendChild(td)
      })

      const link = document.createElement('td')
      link.innerHTML = `<a target="_blank" rel="noopener noreferrer" href="/admin/all-u-vouchers/voucher/${item._id}">Xem</a>`
      newTr.appendChild(link)
      tbody.appendChild(newTr)
      itemIndex++
    })
  }, 1000)
  
  pagination(getVouchers, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
let currentVoucherInfo = null

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => { if (e.target === detailModal) detailModal.classList.remove('show') }

async function openVoucherDetail(voucherId) {
  try {
    detailModal.classList.add('show')

    const response = await fetch('/admin/all-u-vouchers/data/voucher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: voucherId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, voucherInfo, orderInfo } = await response.json()
    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    document.title = voucherInfo.code || 'Voucher Detail'

    // Fill form
    detailModal.querySelector('input[name="userId"]').value      = voucherInfo.userId || ''
    detailModal.querySelector('input[name="orderId"]').value     = voucherInfo.orderId || ''
    detailModal.querySelector('input[name="code"]').value        = voucherInfo.code || ''
    detailModal.querySelector('input[name="description"]').value = voucherInfo.description || ''

    const typeSelect = detailModal.querySelector('select[name="voucherType"]')
    if (typeSelect) typeSelect.querySelectorAll('option').forEach(opt => opt.selected = opt.value === voucherInfo.voucherType)

    detailModal.querySelector('input[name="discount"]').value    = formatNumber(voucherInfo.discount)
    detailModal.querySelector('input[name="minOrder"]').value    = formatNumber(voucherInfo.minOrder)

    const statusSelect = detailModal.querySelector('select[name="status"]')
    if (statusSelect) statusSelect.querySelectorAll('option').forEach(opt => opt.selected = opt.value === voucherInfo.status)

    detailModal.querySelector('input[name="startDate"]').value   = voucherInfo.startDate?.split('T')[0] || ''
    detailModal.querySelector('input[name="endDate"]').value     = voucherInfo.endDate?.split('T')[0] || ''
    detailModal.querySelector('input[name="usedAt"]').value      = voucherInfo.usedAt ? voucherInfo.endDate?.split('T')[0] : ''

    // Bảng đơn hàng liên quan
    const orderTbody = detailModal.querySelector('table#table-2 tbody')
    if (orderTbody) {
      orderTbody.innerHTML = ''
      orderInfo?.forEach((order, i) => {
        const tr = document.createElement('tr')
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${formatNumber(order.totalOrderPrice)}</td>
          <td>${order.paymentMethod?.name || ''}</td>
          <td>${order.orderStatus?.name || ''}</td>
          <td><a href="/admin/all-orders/order/${order._id}"><i class="fi fi-rr-eye"></i></a></td>
        `
        orderTbody.appendChild(tr)
      })
    }

    // Lưu lại để so sánh khi update
    currentVoucherInfo = {
      _id: voucherInfo._id,
      description: voucherInfo.description,
      status: voucherInfo.status,
      startDate: voucherInfo.startDate?.split('T')[0],
      endDate: voucherInfo.endDate?.split('T')[0]
    }

  } catch (err) {
    console.error('Error opening voucher detail:', err)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

// UPDATE VOUCHER (chỉ cập nhật các trường được phép)
async function updateVoucher() {
  const description = detailModal.querySelector('input[name="description"]').value.trim()
  const status      = detailModal.querySelector('select[name="status"]').value
  const startDate   = detailModal.querySelector('input[name="startDate"]').value
  const endDate     = detailModal.querySelector('input[name="endDate"]').value

  if (
    description === currentVoucherInfo.description &&
    status      === currentVoucherInfo.status &&
    startDate   === currentVoucherInfo.startDate &&
    endDate     === currentVoucherInfo.endDate
  ) {
    return pushNotification('Please update the information')
  }

  detailModal.querySelector('button[type="submit"]').classList.add('loading')

  const response = await fetch('/admin/all-u-vouchers/voucher/updated', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: currentVoucherInfo._id,
      description,
      status,
      startDate,
      endDate
    })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { error, message } = await response.json()

  detailModal.querySelector('button[type="submit"]').classList.remove('loading')
  if (error) return pushNotification(error)

  pushNotification(message)
  detailModal.classList.remove('show')
  await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
}

detailModal.querySelector('button[type="submit"]')?.addEventListener('click', updateVoucher)

// CREATE MODAL (nếu có)
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal?.querySelector('.close-modal')
const createSubmitBtn = createModal?.querySelector('button[type="submit"]')

if (createBtn) createBtn.onclick = () => createModal.classList.add('show')
if (createCloseBtn) createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal?.addEventListener('click', e => { if (e.target === createModal) createModal.classList.remove('show') })

async function createVoucher() {
  const name        = createModal.querySelector('input#name')?.value.trim()
  const description = createModal.querySelector('input#description')?.value.trim()
  const memberCode  = createModal.querySelector('select#memberCode')?.value
  const discount    = deFormatNumber(createModal.querySelector('input#discount')?.value || '0')
  const maxDiscount = deFormatNumber(createModal.querySelector('input#maxDiscount')?.value || '0')
  const minOrder    = deFormatNumber(createModal.querySelector('input#minOrder')?.value || '0')
  const startDate   = createModal.querySelector('input#start-date')?.value
  const endDate     = createModal.querySelector('input#end-date')?.value

  if (!name || !description || !memberCode || !discount || !minOrder || !startDate || !endDate) {
    return pushNotification('Please fill in all information!')
  }

  const response = await fetch('/admin/all-vouchers/voucher/created', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, description, memberCode, discount, maxDiscount, minOrder, startDate, endDate
    })
  })

  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const { error, message } = await response.json()
  if (error) return pushNotification(error)

  pushNotification(message)
  createModal.classList.remove('show')
  await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
}

if (createSubmitBtn) createSubmitBtn.onclick = () => createVoucher()

// DOM Loaded
window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getVouchers(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getVouchers, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH VOUCHER')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})
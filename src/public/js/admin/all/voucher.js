importLinkCss('/css/admin/all/vouchers.css')

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
    <label><input type="checkbox" value="code" checked> Mã Voucher</label>
    <label><input type="checkbox" value="name" checked> Tên Voucher</label>
    <label><input type="checkbox" value="description" checked> Mô tả</label>
    <label><input type="checkbox" value="memberCode" checked> Hạng thành viên</label>
    <label><input type="checkbox" value="discount" checked> Mức chiết khấu</label>
    <label><input type="checkbox" value="maxDiscount"> Mức tối đa</label>
    <label><input type="checkbox" value="minOrder"> Đơn tối thiểu</label>
    <label><input type="checkbox" value="status"> Tình trạng</label>
    <label><input type="checkbox" value="startDate"> Ngày bắt đầu</label>
    <label><input type="checkbox" value="endDate"> Ngày kết thúc</label>
    <label><input type="checkbox" value="usedAt"> Ngày sử dụng</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  const response = await fetch('/admin/all-vouchers/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {memberShip, error} = await response.json()
  if (error) return pushNotification(error)

  memberShip.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select#memberCode').appendChild(option)
  })
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

  const response = await fetch('/admin/all-vouchers/data/vouchers', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
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

  window.setTimeout(function() {
    thead.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    // header
    const trHead = document.createElement("tr")

  const headData = document.createElement('td')
  headData.textContent = 'NO'
  trHead.appendChild(headData)

  selected.forEach(col => {
    const td = document.createElement("td")
    td.textContent = col.name
    trHead.appendChild(td)
  })

  const headLink = document.createElement('td')
  headLink.textContent = 'Actions'
  trHead.appendChild(headLink)

  thead.appendChild(trHead)

  // body
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.remove()
  })

  data.forEach((item, index) => {
    const newTr = document.createElement('tr')

    const itemData = document.createElement('td')
    itemData.textContent = index + (currentPage - 1) * itemsPerPage + 1
    newTr.appendChild(itemData)

    selected.forEach(col => {
      const td = document.createElement("td")
      td.textContent = col.name
      trHead.appendChild(td)
    })

    const openButton = document.createElement('td')
    openButton.style.textAlign = 'center'
    openButton.innerHTML = `<button class="view-btn" title="View details"><i class="fi fi-rr-eye"></i></button>`
    openButton.onclick = async function() {
      await openVoucherDetail(item._id)
    }

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

        if (['discount', 'maxDiscount', 'minOrder', 'startDate', 'endDate', 'usedAt'].includes(col.value) ) td.style.textAlign = 'right'
        if (['maxDiscount', 'minOrder'].includes(col.value)) td.textContent = formatNumber(item[col.value])
        if (['discount'].includes(col.value)) td.textContent = formatPercentage(item[col.value])
        if (['startDate', 'endDate', 'usedAt'].includes(col.value)) td.textContent = formatDate(item[col.value])

        newTr.appendChild(td)
      })

      const link = document.createElement('td')
      link.innerHTML = `<a target="_blank" rel="noopener noreferrer" href="/admin/all-vouchers/voucher/${item._id}">Xem</a>`
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
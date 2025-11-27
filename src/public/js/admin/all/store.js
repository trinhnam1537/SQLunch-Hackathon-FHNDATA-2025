importLinkCss('/css/admin/all/stores.css')

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
    <label><input type="checkbox" value="_id" checked> Mã đại lý</label>
    <label><input type="checkbox" value="name" checked> Tên đại lý</label>
    <label><input type="checkbox" value="address" checked> Địa chỉ</label>
    <label><input type="checkbox" value="details" > Chi tiết</label>
    <label><input type="checkbox" value="revenue" checked> Tổng doanh thu</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getFilter() {
  const response = await fetch('/admin/all-customers/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {error} = await response.json()
  if (error) return pushNotification(error)
}

async function getStores(sortOptions, filterOptions, currentPage, itemsPerPage) {
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

  const response = await fetch('/admin/all-stores/data/stores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'đại lý: ' + dataSize.size

  // Rebuild THEAD
  thead.querySelectorAll('tr').forEach(tr => tr.remove())
  const trHead = document.createElement('tr')
  const thNo = document.createElement('td')
  thNo.textContent = 'No'
  trHead.appendChild(thNo)
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

      if (col.value === 'revenue') {
        td.textContent = formatNumber(value)
        td.style.textAlign = 'right'
      } else {
        td.textContent = value
      }

      tr.appendChild(td)
    })

    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `<button class="view-btn" title="View details"><i class="fi fi-rr-eye"></i></button>`
    tdAction.onclick = () => openStoreDetail(item._id)
    tr.appendChild(tdAction)

    tbody.appendChild(tr)
  })

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')
      newTr.innerHTML = `
        <td>${productIndex}</td>
        <td>${item._id}</td>
        <td>${item.name}</td>
        <td>${item.address}</td>
        <td style="text-align: right;">${formatNumber(item.revenue)}</td>
        <td><a target="_blank" rel="noopener noreferrer" href="/admin/all-stores/store/${item._id}">Xem</a></td>
      `
      tbody.appendChild(newTr)
      productIndex++
    })
  }, 1000)
  
  pagination(getStores, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getFilter()
    await getStores(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getStores, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH ĐẠI LÝ')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})
importLinkCss('/css/admin/all/purchases.css')

const tbody         = document.querySelector('table').querySelector('tbody')
const thead         = document.querySelector('table').querySelector('thead')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Mã đơn hàng</label>
    <label><input type="checkbox" value="supplierId" > Tên Khách hàng</label>
    <label><input type="checkbox" value="purchaseDate" checked> Ngày nhập</label>
    <label><input type="checkbox" value="note" > Ghi chú</label>
    <label><input type="checkbox" value="totalProducts" checked> Tổng sản phẩm</label>
    <label><input type="checkbox" value="totalPurchasePrice"> Tổng giá trị</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
} 

async function getPurchases(sortOptions, filterOptions, currentPage, itemsPerPage) {
  tbody.querySelectorAll('tr').forEach((tr, index) => {
    tr.querySelector('td:nth-child(1)').textContent = ''
    tr.querySelector('td:nth-child(1)').classList.add('loading')
  })

  const response = await fetch('/admin/all-purchases/data/purchases', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      sort  : sortOptions, 
      filter: filterOptions, 
      page  : currentPage,
      itemsPerPage: itemsPerPage
    })
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Đơn nhập: ' + dataSize.size

  window.setTimeout(function() {
    tbody.querySelectorAll('tr').forEach((tr, index) => {
      tr.remove()
    })

    let productIndex = (currentPage - 1) * 10 + 1

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')
      newTr.innerHTML = `
        <td>${productIndex}</td>
        <td>${item._id}</td>
        <td style="text-align: right;">${formatDate(item.purchaseDate)}</td>
        <td style="text-align: right;">${item.totalProducts}</td>
        <td style="text-align: right;">${formatNumber(item.totalPurchasePrice)}</td>
        <td><a target="_blank" rel="noopener noreferrer" href="/admin/all-purchases/purchase/${item._id}">Xem</a></td>
      `
      tbody.appendChild(newTr)
      productIndex++
    })
  }, 1000)
  
  pagination(getPurchases, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function() {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display === 'none' ? columnLists.style.display = 'block' : columnLists.style.display = 'none'
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getPurchases(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getPurchases, sortOptions, filterOptions, currentPage.page)
    await exportJs('BÁO CÁO DANH SÁCH ĐƠN NHẬP')
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})
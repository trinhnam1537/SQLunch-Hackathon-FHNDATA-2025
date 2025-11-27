importLinkCss('/css/admin/all/brands.css')

const tbody         = document.querySelector('table').querySelector('tbody')
const paginationBtn = document.querySelector('select[name="pagination"]')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

async function getFilter() {
  const response = await fetch('/admin/all-customers/data/filter', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, error} = await response.json()
  if (error) return pushNotification(error)

  data.forEach((element, index) => {
    const option = document.createElement('option')
    option.value = element.code
    option.textContent = element.name
    document.querySelector('select#memberCode').appendChild(option)
  })
}

async function getBrands(sortOptions, filterOptions, currentPage, itemsPerPage) {
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

  const response = await fetch('/admin/all-brands/data/brands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size, error} = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size

  document.querySelector('div.board-title').querySelector('p').textContent = 'Thương hiệu: ' + dataSize.size

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

    // STT
    const tdNo = document.createElement('td')
    tdNo.textContent = rowIndex
    tr.appendChild(tdNo)

    // Các cột được chọn
    selected.forEach(col => {
      const td = document.createElement('td')

      if (col.value === 'name') {
        td.innerHTML = `
          <div style="display: flex; justify-content: start; align-items: center; gap: 8px;">
            <img src="${item.img?.path || '/images/default-brand.png'}" 
                 alt="${item.name}" 
                 loading="lazy" 
                 style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px;">
            <span>${item.name || ''}</span>
          </div>
        `
      } 
      else if (col.value === 'totalProduct') {
        td.textContent = item.totalProduct || 0
        td.style.textAlign = 'right'
      }
      else if (col.value === 'totalRevenue') {
        td.textContent = formatNumber(item.totalRevenue || 0)
        td.style.textAlign = 'right'
      }
      else {
        td.textContent = item[col.value] ?? ''
      }

      tr.appendChild(td)
    })

    // Cột hành động
    const tdAction = document.createElement('td')
    tdAction.style.textAlign = 'center'
    tdAction.innerHTML = `<button class="view-btn" id="${item._id}"><i class="fi fi-rr-eye"></i></button>`   
    tdAction.onclick = () => openBrandDetail(item._id)
    tr.appendChild(tdAction)

    tbody.appendChild(tr)
  })

    data.forEach((item, index) => {
      const newTr = document.createElement('tr')
      newTr.innerHTML = `
        <td>${productIndex}</td>
        <td style="display: flex; justify-content: start;align-items: center;gap: 5px">
          <img src="${item.img.path}" alt="${item.name}" loading="lazy" loading="lazy"> 
          <p>${item.name}</p>
        </td> 
        <td style="text-align: right;">${item.totalProduct}</td>
        <td style="text-align: right;">${item.totalProduct}</td>
        <td style="text-align: right;">${formatNumber(item.totalRevenue)}</td>
        <td><a target="_blank" rel="noopener noreferrer" href="/admin/all-brands/brand/${item._id}">Xem</a></td>
      `
      tbody.appendChild(newTr)
      productIndex++
    })
  }, 1000)
  
  pagination(getBrands, sortOptions, filterOptions, currentPage, dataSize.size)
}

paginationBtn.onchange = function () {
  const selectedValue = parseInt(paginationBtn.value)
  currentPage.page = 1
  getBrands(sortOptions, filterOptions, currentPage.page, selectedValue)
}

window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    await getBrands(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getBrands, sortOptions, filterOptions, currentPage.page)
    await exportJs()
  } catch (error) {
    console.error('Error loading data:', error)
    pushNotification(error)
  }
})
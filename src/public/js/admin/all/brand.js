importLinkCss('/css/admin/all/brands.css')

// ALL
const thead         = document.querySelector('table').querySelector('thead')
const tbody         = document.querySelector('table').querySelector('tbody')
const changeColumns = document.querySelector('i.fi.fi-rr-objects-column')
const sortOptions   = {}
const filterOptions = {}
const currentPage   = { page: 1 }
const dataSize      = { size: 0 }
const searchInput   = document.querySelector('input#search-input')

function generateColumns() {
  const columnsGroup = document.querySelector('div.checkbox-group')
  const inputList = `
    <label><input type="checkbox" value="_id" checked> Brand Code</label>
    <label><input type="checkbox" value="name" checked> Brand Name</label>
    <label><input type="checkbox" value="totalProduct" checked> Total Products</label>
    <label><input type="checkbox" value="totalRevenue" checked> Total Revenue</label>
  `
  columnsGroup.insertAdjacentHTML('beforeend', inputList)
}

async function getBrands(sortOptions, filterOptions, currentPage, itemsPerPage) {
  // Loading state
  tbody.querySelectorAll('tr').forEach(tr => {
    const firstTd = tr.querySelector('td:nth-child(1)')
    if (firstTd) {
      firstTd.textContent = ''
      firstTd.classList.add('loading')
    }
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
  const { data, data_size, error } = await response.json()
  if (error) return pushNotification(error)

  dataSize.size = data_size
  document.querySelector('div.board-title p').textContent = 'Brands: ' + dataSize.size

  // Lấy các cột được chọn
  const selected = Array.from(document.querySelectorAll('.checkbox-group input:checked'))
    .map(cb => ({
      value: cb.value,
      name: cb.closest('label').innerText.trim()
    }))

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

  pagination(getBrands, sortOptions, filterOptions, currentPage, dataSize.size)
}

changeColumns.onclick = function () {
  const columnLists = document.querySelector('div.checkbox-group')
  columnLists.style.display = columnLists.style.display === 'none' ? 'block' : 'none'
}

// DETAIL MODAL
const detailModal       = document.querySelector('#detail-modal')
const detailCloseBtn    = detailModal.querySelector('.close-modal')
const detailUpdateBtn   = detailModal.querySelector('button[type="submit"]')
let currentBrandInfo    = null
let imgPath             = { path: '' }

detailCloseBtn.onclick = () => detailModal.classList.remove('show')
detailModal.onclick = e => {
  if (e.target === detailModal) detailModal.classList.remove('show')
}

// Xử lý ảnh khi thay đổi
detailModal.querySelector('input#img')?.addEventListener('change', function () {
  const file = this.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      imgPath.path = reader.result
      detailModal.querySelector('img#image').src = reader.result
    }
    reader.readAsDataURL(file)
  }
})

async function openBrandDetail(brandId) {
  try {
    detailModal.classList.add('show')

    const response = await fetch('/admin/all-brands/data/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: brandId })
    })

    if (!response.ok) throw new Error(`Response status: ${response.status}`)
    const { error, brandInfo } = await response.json()

    if (error) {
      pushNotification('An error occurred')
      detailModal.classList.remove('show')
      return
    }

    detailModal.querySelector('input[name="id"]').value = brandInfo._id || ''
    detailModal.querySelector('input[name="name"]').value = brandInfo.name || ''
    detailModal.querySelector('input[name="totalProduct"]').value = brandInfo.totalProduct || 0
    detailModal.querySelector('input[name="totalRevenue"]').value = formatNumber(brandInfo.totalRevenue) || ''
    detailModal.querySelector('img#image').src = brandInfo.img?.path || '/images/default-product.png'

    // Lưu để so sánh khi cập nhật
    currentBrandInfo = {
      _id: brandInfo._id,
      name: brandInfo.name
    }

  } catch (err) {
    console.error('Error opening brand detail:', err)
    pushNotification('An error occurred')
    detailModal.classList.remove('show')
  }
}

async function updateBrand() {
  try {
    if (!currentBrandInfo) return;

    const nameInput = detailModal.querySelector('input[name="name"]');
    const name = nameInput.value.trim();

    // Check if anything actually changed
    const hasNameChanged = name !== currentBrandInfo.name;
    const hasImageChanged = !!imgPath.path; // new image selected

    if (!hasNameChanged && !hasImageChanged) {
      return pushNotification('Please update the brand name or logo', 'warning');
    }

    if (!name) {
      return pushNotification('Brand name is required!', 'error');
    }

    // Build payload
    const payload = {
      id: currentBrandInfo._id,
      name: name,
      oldImageId: currentBrandInfo.img?.filename || null  // for deleting old logo
    };

    // Only send new image if user uploaded one
    if (imgPath.path) {
      payload.img = imgPath.path; // base64 data URL
    }

    detailUpdateBtn.classList.add('loading');

    const response = await fetch('/admin/all-brands/brand/updated', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Update failed');
    }

    pushNotification(data.message || 'Brand updated successfully!', 'success');

    // Reset UI
    detailModal.classList.remove('show');
    imgPath.path = ''; // clear preview
    await getBrands(sortOptions, filterOptions, currentPage.page, 10);

  } catch (error) {
    console.error('Error updating brand:', error);
    pushNotification(error.message || 'Failed to update brand', 'error');
  } finally {
    detailUpdateBtn.classList.remove('loading');
  }
}

detailUpdateBtn.onclick = () => updateBrand()

// CREATE MODAL
const createModal     = document.querySelector('#create-modal')
const createBtn       = document.querySelector('.create-btn')
const createCloseBtn  = createModal.querySelector('.close-modal')
const createSubmitBtn = createModal.querySelector('button[type="submit"]')
let createImgPath     = { path: '' }

createBtn.onclick = () => createModal.classList.add('show')
createCloseBtn.onclick = () => createModal.classList.remove('show')
createModal.onclick = e => {
  if (e.target === createModal) createModal.classList.remove('show')
}

createModal?.querySelector('input#img')?.addEventListener('change', function () {
  const file = this.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => createImgPath.path = reader.result
    reader.readAsDataURL(file)
  }
})

async function createBrand() {
  try {
    const nameInput = createModal.querySelector('input#name')
    const name = nameInput.value.trim();

    if (!name) {
      return pushNotification('Please enter brand name!', 'error');
    }

    // Optional: warn if no logo but still allow creation
    // if (!createImgPath.path) {
    //   return pushNotification('Please upload a brand logo!', 'warning');
    // }

    createSubmitBtn.classList.add('loading');

    const payload = {
      name: name
    };

    // Only send image if user selected one
    if (createImgPath.path) {
      payload.img = createImgPath.path; // base64 data URL
    }

    const response = await fetch('/admin/all-brands/brand/created', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || 'Creation failed');
    }

    pushNotification(data.message || 'Brand created successfully!', 'success');

    // Reset form
    createModal.classList.remove('show');
    nameInput.value = '';
    createImgPath.path = ''; // clear preview
    createSubmitBtn.classList.remove('loading');

    // Refresh list
    await getBrands(sortOptions, filterOptions, currentPage.page, 10);

  } catch (error) {
    console.error('Error creating brand:', error);
    pushNotification(error.message || 'Failed to create brand', 'error');
  } finally {
    createSubmitBtn.classList.remove('loading');
  }
}

createSubmitBtn.onclick = () => createBrand()

// DOM Loaded
window.addEventListener('DOMContentLoaded', async function loadData() {
  try {
    generateColumns()
    await getBrands(sortOptions, filterOptions, currentPage.page, 10)
    await sortAndFilter(getBrands, sortOptions, filterOptions, currentPage.page)
    await exportJs('BRAND LIST REPORT')
  } catch (err) {
    console.error('Error loading data:', err)
    pushNotification('An error occurred while loading data')
  }
})
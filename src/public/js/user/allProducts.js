importLinkCss('/css/user/allProducts.css')

const mainTitle        = document.querySelector('div.main-title').querySelector('b')
const skincareCategory = document.querySelector('div.all-category-skincare')
const makeupCategory   = document.querySelector('div.all-category-makeup')
const allProducts      = document.querySelector('div[class="products"]').querySelectorAll('div.product')
const pagination       = document.querySelector('span.pagination')
const urlSlug          = new URL(window.location).pathname.split('/').slice(1).filter(slug => slug !== 'all-products')
const sortOptions      = {}
const filterOptions    = { deletedAt: null, [urlSlug[0]]: urlSlug[1] }
const currentPage      = { page: 1 }

const titles = {
  'flash-sale': 'Dòng sản phẩm đang sale',
  'hot': 'Dòng sản phẩm đang hot',
  'new-arrival': 'Dòng sản phẩm mới về',
  'xit-khoang': 'Dòng sản phẩm Xịt khoáng',
  'mat-na': 'Dòng sản phẩm Mặt nạ',
  'serum': 'Dòng sản phẩm Serum',
  'bha': 'Dòng sản phẩm Bha',
  'tay-da-chet': 'Dòng sản phẩm Tẩy da chết',
  'duong-da': 'Dòng sản phẩm Dưỡng da',
  'toner': 'Dòng sản phẩm toner',
  'nuoc-tay-trang': 'Dòng sản phẩm Nước tẩy trang',
  'cham-mun': 'Dòng sản phẩm Chấm mụn',
  'kem-duong-am': 'Dòng sản phẩm Kem dưỡng ẩm',
  'sua-rua-mat': 'Dòng sản phẩm Sữa rửa mặt',
  'phan-ma': 'Dòng sản phẩm Phấn má',
  'mascara': 'Dòng sản phẩm mascara',
  'ke-mat': 'Dòng sản phẩm Kẻ mắt',
  'kem-chong-nang': 'Dòng sản phẩm Kem chống nắng',
  'che-khuyet-diem': 'Dòng sản phẩm Che khuyết điểm',
  'son': 'Dòng sản phẩm son',
  'makeup': 'Dòng sản phẩm makeup',
  'skincare': 'Dòng sản phẩm skincare'
}

if (titles[urlSlug[1]]) mainTitle.innerText = titles[urlSlug[1]]

if (urlSlug.includes('skincare')) {
  skincareCategory.innerHTML = `
    <ul>
      <li><a href="/all-products/skincare/xit-khoang">Xịt khoáng<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079975/web-img/mhseyytpn8h6zvg4tabd_r57wfv.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/mat-na">Mặt nạ<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079978/web-img/sfudjh00pykqpvav4sgy_xqbzev.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/serum">Serum<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079970/web-img/kjz3zdlyxo76h1p3t6lm_uk4agl.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/bha">BHA<img src="https://res.cloudinary.com/bunny-store/image/upload/v1730814300/web-img/dfw5hkqs9gww8tzb6q94_amc5t1.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/tay-da-chet">Tẩy da chết<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079964/web-img/ettmlmf7s4x0g8d98nvq_vklnps.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/duong-da">Dưỡng da<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079987/web-img/xkkpidyegeiesbea9rk5_b4tgej.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/toner">Toner<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079967/web-img/k0easo5upkoydszse1i3_jp7mrg.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/nuoc-tay-trang">Nước tẩy trang<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079972/web-img/md2husxtaoo5kmyp6qxy_cmvvnp.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/cham-mun">Chấm mụn<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079961/web-img/almfjrziupsfnxh4ikej_hfcib1.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/kem-duong-am">Kem dưỡng ẩm<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079981/web-img/sznuvy878jkx6irn87wt_molje8.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/skincare/sua-rua-mat">Sữa rửa mặt<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711079959/web-img/zeuznbkrsspuucipy2bh_akixfj.webp" alt="loading" loading="lazy"></a></li>
    </ul>    
  `
}
if (urlSlug.includes('makeup')) {
  makeupCategory.innerHTML = `
    <ul>
      <li><a href="/all-products/makeup/phan-ma">Phấn má<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711080154/web-img/o1th0fymd3gzjzgwbrbz_ghkt70.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/makeup/mascara">Mascara<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711080143/web-img/ejschlqugyhr4asayspm_hbrdiy.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/makeup/ke-mat">Kẻ mắt<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711080172/web-img/djy7wut0chooynp65hov_xxbwxi.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/makeup/kem-chong-nang">Kem chống nắng<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711080150/web-img/hspzixrzay9whcg51meo_h4iotk.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/makeup/che-khuyet-diem" loading="lazy">Che khuyết điểm<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711080188/web-img/vr3yzblr5g0crzkgj9po_e8mrjp.webp" alt="loading" loading="lazy"></a></li>
      <li><a href="/all-products/makeup/son">Son<img src="https://res.cloudinary.com/bunny-store/image/upload/v1711080146/web-img/jd2llxirfbwpdwekk7lz_cpznu5.webp" alt="loading" loading="lazy"></a></li>
    </ul>
  `
}

async function paginatingProducts(data_size) {
  pagination.querySelectorAll('p').forEach(p => p.remove())
  var totalPage = 1
  for (var i = 0; i < data_size; i += 10) {
    const newPage = document.createElement('p')
    if (i === 0) newPage.classList.add('current')
    newPage.innerText = `${totalPage}`
    pagination.appendChild(newPage)
    newPage.onclick = function() {
      pagination.querySelectorAll('p').forEach(t => t.classList.remove('current'))
      currentPage.page = parseInt(newPage.innerText) 
      newPage.classList.add('current')

      getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
    }
    totalPage++
  }
}

async function checkingClearButton(clearSortBtn, clearFilterBtn) {
  if (Object.keys(sortOptions).length > 0) clearSortBtn.style.display = ''
  if (Object.keys(filterOptions).length > 2) clearFilterBtn.style.display = ''
}

async function getProducts(products, sortOptions, filterOptions, currentPage) {
  products.forEach((product, index) => {
    product.querySelector('div.loading').style.display = ''
  })

  const response = await fetch('/all-products/data/products', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({sort: sortOptions, filter: filterOptions, page: currentPage})
  })
  if (!response.ok) throw new Error(`Response status: ${response.status}`)
  const {data, data_size} = await response.json()

  window.setTimeout(function() {
    products.forEach((product, index) => {
      if (index < data.length) {
        product.querySelector('img').setAttribute('src', data[index].img.path)
        product.querySelector('img').setAttribute('alt', data[index].img.name)
        product.querySelector('p#old-price').textContent = formatNumber(data[index].oldPrice) 
        product.querySelector('p#price').textContent = formatNumber(data[index].price) 
        product.querySelector('p#name').textContent = data[index].name
        product.querySelector('span#rate-score').textContent = formatRate(data[index].rate) 
        product.querySelector('p#sale-number').textContent =  'Đã bán: ' + data[index].saleNumber
        product.querySelector('div.loading').style.display = 'none'
        product.querySelectorAll('i').forEach((star, i) => {
          star.style.color = 'black'
        })
        product.querySelectorAll('i').forEach((star, i) => {
          if (i + 1 <= Math.floor(parseInt(product.querySelector('span#rate-score').innerText))) star.style.color = 'orange'
        })
        product.style.display = ''
        product.parentElement.setAttribute('href', '/all-products/product/' + data[index]._id)
      } else {
        product.style.display = 'none'
      }
    })
  }, 1000)
  
  return data_size
}

function calcLeftPosition(value) {
  return (value - minPrice)/(maxPrice - minPrice) * 100
}

// sort
const sortButton = document.querySelector('div.sort').querySelectorAll('select')
sortButton.forEach((button) => {
  button.onchange = function () {
    const sortType = button.id
    const sortValue = parseInt(button.value)
    sortOptions[sortType] = sortValue
    if (!sortValue) delete sortOptions[sortType]
    getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
    checkingClearButton(clearSortBtn, clearFilterBtn)
  }
}) 

const clearSortBtn = document.querySelector('div.sort').querySelector('button#clear-sort')
clearSortBtn.onclick = function() {
  Object.keys(sortOptions).forEach(key => delete sortOptions[key])
  getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
  sortButton.forEach((button) => {
    button.selectedIndex = 0
  }) 
  clearSortBtn.style.display = 'none'
}

// filter
const minPrice = 10000
const maxPrice = 1000000
document.querySelector('div.filter').querySelector('input#rangeMin').addEventListener('input', function (e) {
  const newValue = parseInt(e.target.value)
  if (newValue > maxPrice) return

  document.querySelector('div.filter').querySelector('span#thumbMin').style.left = calcLeftPosition(newValue) + '%'
  document.querySelector('div.filter').querySelector('span#min').innerHTML = formatNumber(newValue)
  document.querySelector('div.filter').querySelector('input#rangeMin').value = newValue

  const line = document.querySelector('div.filter').querySelector('div#line')
  line.style.left  = calcLeftPosition(newValue) + '%'
  line.style.right = (100 - calcLeftPosition(maxPrice)) + '%'
})
document.querySelector('div.filter').querySelector('input#rangeMax').addEventListener('input', function (e) {
  const newValue = parseInt(e.target.value)
  if (newValue > maxPrice) return

  document.querySelector('div.filter').querySelector('span#thumbMax').style.left = calcLeftPosition(newValue) + '%'
  document.querySelector('div.filter').querySelector('span#max').innerHTML = formatNumber(newValue)
  document.querySelector('div.filter').querySelector('input#rangeMax').value = newValue

  const line = document.querySelector('div.filter').querySelector('div#line')
  line.style.left  = calcLeftPosition(minPrice) + '%'
  line.style.right = (100 - calcLeftPosition(newValue)) + '%'
})
document.querySelector('div.filter').querySelector('button#submit-filter').addEventListener('click', async function() {
  const min = parseInt(document.querySelector('div.filter').querySelector('input#rangeMin').value)
  const max = parseInt(document.querySelector('div.filter').querySelector('input#rangeMax').value)
  if (min === minPrice && max === maxPrice) return

  filterOptions.price = `${min}-${max}`
  const data_size = await getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
  // pagination.querySelectorAll('p').forEach(p => p.remove())
  paginatingProducts(data_size)
  checkingClearButton(clearSortBtn, clearFilterBtn)
})

const clearFilterBtn = document.querySelector('div.filter').querySelector('button#clear-filter')
clearFilterBtn.onclick = async function() {
  delete filterOptions['price']
  clearFilterBtn.style.display = 'none'
  
  document.querySelector('div.filter').querySelector('span#thumbMin').style.left  = calcLeftPosition(minPrice) + '%'
  document.querySelector('div.filter').querySelector('span#min').innerHTML        = formatNumber(minPrice)
  document.querySelector('div.filter').querySelector('input#rangeMin').value      = minPrice
  
  document.querySelector('div.filter').querySelector('span#thumbMax').style.left  = calcLeftPosition(maxPrice) + '%'
  document.querySelector('div.filter').querySelector('span#max').innerHTML        = formatNumber(maxPrice)
  document.querySelector('div.filter').querySelector('input#rangeMax').value      = maxPrice

  document.querySelector('div.filter').querySelector('div#line').style.left  = calcLeftPosition(minPrice) + '%'
  document.querySelector('div.filter').querySelector('div#line').style.right = (100 - calcLeftPosition(minPrice)) + '%'
  
  const data_size = await getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
  paginatingProducts(data_size)
}

async function loadData(retriesLeft) {
  try {
    const data_size = await getProducts(allProducts, sortOptions, filterOptions, currentPage.page)
    paginatingProducts(data_size)
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

// setTimeout(() => {
//   getLog(
//     topic = 'page-view',
//     value = {
//       user_id: window.uid,
//       page_type: urlSlug[1],
//       timestamp: new Date(),
//     }
//   );
// }, 1000)
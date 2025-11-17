const tagList = document.querySelector('div.sidebar-menu').querySelector('div.tag')
const profileBtn = tagList.querySelector('a.profile')
const orderBtn = tagList.querySelector('a.order')
const rateOrderBtn = tagList.querySelector('a.rateOrder')
const feedBackBtn = tagList.querySelector('a.feedBack')

const tagMap = {
  profile   : profileBtn,
  order     : orderBtn,
  rateOrder : rateOrderBtn,
  feedBack  : feedBackBtn
}

if (tagMap[index]) tagMap[index].style.backgroundColor = '#5ab868'
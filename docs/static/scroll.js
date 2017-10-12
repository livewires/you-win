
window.addEventListener('scroll', onScroll)
window.addEventListener('resize', onScroll)

var timeout
function onScroll(e) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(scrollEnd, 50)
}

function scrollEnd() {
  var headings = document.querySelectorAll('h2')
  var offset = window.innerHeight / 2
  for (var i=headings.length; i--; ) {
    var h2 = headings[i]
    if (h2.offsetTop < window.scrollY + offset) {
      var cur = document.querySelector('.page-heading-active')
      if (cur) cur.className = 'page-heading'
      //cur = document.querySelector('.page-title-active')
      //if (cur) cur.className = ''
      document.querySelector('a[href="#' + h2.id + '"]').parentNode.className = 'page-heading page-heading-active'
      return
    }
  }
  //document.querySelector('a[href="#"]').className = 'page-title-active'
}




const tabsBar = document.getElementById('tabs-bar')
const iframesContainer = document.getElementById('iframes-container')

let tabs = []
let activeTabId = null

function addTab(url = '') {
  const id = Date.now().toString()
  const tab = {
    id,
    url,
    title: 'New Tab',
  }

  tabs.push(tab)

  const tabElement = document.createElement('div')
  tabElement.className = 'tab'
  tabElement.id = `tab-${id}`
  tabElement.innerHTML = `
        <span class="tab-title">New Tab</span>
        <div class="tab-buttons">
          <i class="fa-solid fa-expand tab-btn" title="Fullscreen" onclick="event.stopPropagation(); toggleTabFullscreen('${id}')"></i>
          <i class="fa-solid fa-xmark tab-btn" title="Close" onclick="event.stopPropagation(); closeTab('${id}')"></i>
        </div>
    `
  tabElement.onclick = () => switchTab(id)
  
  const addBtn = document.getElementById('add-tab')
  tabsBar.insertBefore(tabElement, addBtn)

  const iframe = document.createElement('iframe')
  iframe.id = `iframe-${id}`
  
  iframe.onload = () => {
    try {
      const title = iframe.contentDocument.title || 'New Tab'
      tab.title = title
      tabElement.querySelector('.tab-title').innerText = title
    } catch (e) {
      console.log("Could not read iframe title", e)
    }
  }

  iframesContainer.appendChild(iframe)
  switchTab(id)

  if (url) {
    loadUrlInTab(id, url)
  } else {
    loadUrlInTab(id, '/new')
  }

  return id
}

function switchTab(id) {
  activeTabId = id
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
  document.querySelectorAll('#iframes-container iframe').forEach((f) => f.classList.remove('active'))

  const activeTab = document.getElementById(`tab-${id}`)
  const activeIframe = document.getElementById(`iframe-${id}`)

  if (activeTab) activeTab.classList.add('active')
  if (activeIframe) activeIframe.classList.add('active')
}

function closeTab(id) {
  const index = tabs.findIndex((t) => t.id === id)
  if (index === -1) return

  tabs.splice(index, 1)
  document.getElementById(`tab-${id}`).remove()
  document.getElementById(`iframe-${id}`).remove()

  if (tabs.length === 0) {
    exit()
  } else if (activeTabId === id) {
    switchTab(tabs[Math.max(0, index - 1)].id)
  }
}

function toggleTabFullscreen(id) {
  const iframe = document.getElementById(`iframe-${id}`)
  if (!iframe) return

  if (iframe.requestFullscreen) {
    iframe.requestFullscreen()
  } else if (iframe.webkitRequestFullscreen) {
    iframe.webkitRequestFullscreen()
  } else if (iframe.msRequestFullscreen) {
    iframe.msRequestFullscreen()
  }
}

function loadUrlInTab(id, url) {
  const iframe = document.getElementById(`iframe-${id}`)

  if (url.startsWith('/')) {
    iframe.src = url
    return
  }

  registerSW().then((worker) => {
    if (!worker) {
      // We don't have 'msg' anymore, let's just alert or log
      console.error('Service worker support required')
      return
    }
    iframe.src = resolveURL(url)
  })
}

function searchurl(url) {
  let searchUrl = ''
  switch (localStorage.getItem('shuttle||search')) {
    case 'ddg':
      searchUrl = `https://duckduckgo.com/?q=${url}`
      break
    case 'brave':
      searchUrl = `https://search.brave.com/search?q=${url}`
      break
    default:
    case 'google':
      searchUrl = `https://www.google.com/search?q=${url}`
      break
  }
  proxy(searchUrl)
}

function go(url) {
  if (!isUrl(url)) searchurl(url)
  else {
    if (!(url.startsWith('https://') || url.startsWith('http://'))) url = 'http://' + url
    proxy(url)
  }
}

function isUrl(val = '') {
  if (/^http(s?):\/\//.test(val) || (val.includes('.') && val.substr(0, 1) !== ' ')) return true
  return false
}

function resolveURL(url) {
  switch (localStorage.getItem('shuttle||proxy')) {
    case 'dy':
      return '/shuttle-dn/' + Ultraviolet.codec.xor.decode(url)
    default:
    case 'uv':
      return __uv$config.prefix + __uv$config.encodeUrl(url)
  }
}

function proxy(url) {
  if (window !== top) {
    window.location.href = resolveURL(url);
    return;
  }

  document.getElementById('align').style.display = 'flex'
  document.querySelector('.sidebar').style.display = 'none'

  if (activeTabId && tabs.length > 0) {
    loadUrlInTab(activeTabId, url)
  } else {
    addTab(url)
  }
}

function exit() {
  document.getElementById('align').style.display = 'none'
  document.querySelector('.sidebar').style.display = ''
  
  tabs = []
  activeTabId = null
  const addBtn = document.getElementById('add-tab')
  tabsBar.innerHTML = ''
  tabsBar.appendChild(addBtn)
  iframesContainer.innerHTML = ''
}
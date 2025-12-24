import { createBareServer } from '@tomphttp/bare-server-node'
import { createServer } from 'node:http'
import { uvPath } from '@titaniumnetwork-dev/ultraviolet'
import { dynamicPath } from '@nebula-services/dynamic'
import express from 'express'

const routes = [
  ['/', 'index'],
  ['/math', 'games'],
  ['/physics', 'apps'],
  ['/settings', 'settings'],
]

const navItems = [
  ['/', 'Home'],
  ['/math', 'Games'],
  ['/physics', 'Apps'],
  ['/settings', 'Settings'],
]

const bare = createBareServer('/bare/')
const app = express()

app.set('view engine', 'ejs')

app.use(express.static('./public'))
app.use('/uv/', express.static(uvPath))
app.use('/dynamic/', express.static(dynamicPath))

for (const [path, page] of routes) {
  app.get(path, (req, res) =>
    res.render('layout', {
      path,
      navItems,
      page,
      domain: 'shuttleproxy.com',
    })
  )
}

app.get('/new', (req, res) => {
  res.render('layout', {
    path: '/',
    navItems,
    page: 'index',
    domain: 'shuttleproxy.com',
    hideSidebar: true
  })
})

app.get('/3kh0', (req, res) => res.render('3kh0'))

app.get('/minigames/ascent', (req, res) => {
  res.render('minigame-ascent', { layout: false })
})

app.use((_, res) => res.status(404).render('404'))

const httpServer = createServer()

httpServer.on('request', (req, res) => {
  if (bare.shouldRoute(req)) bare.routeRequest(req, res)
  else app(req, res)
})

let port = parseInt(process.env.PORT || 8080)

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${port} is in use, trying ${port + 1}...`)
    port++
    httpServer.listen(port)
  } else {
    console.log(err)
  }
})

httpServer.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head)
  else socket.end()
})

httpServer.listen({ port }, () => {
  const addr = httpServer.address()
  console.log(`\x1b[42m\x1b[1m shuttle\n URL: http://localhost:${addr.port}\x1b[0m`)
})

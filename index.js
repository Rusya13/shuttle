import { createBareServer } from '@tomphttp/bare-server-node'
import { createServer } from 'node:http'
import { uvPath } from '@titaniumnetwork-dev/ultraviolet'
import { dynamicPath } from '@nebula-services/dynamic'
import express from 'express'
import fetch from 'node-fetch'

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

// Define routes
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

// Custom Proxy Route - handles requests coming from the custom proxy option
// This needs to be AFTER the standard routes but BEFORE the 404 handler
app.get('/custom-proxy-handler.html/:url', async (req, res) => {
  try {
    const encodedUrl = req.params.url
    console.log(`[Custom Proxy] Received encoded URL: ${encodedUrl}`)

    // Convert URL-safe base64 back to standard base64
    const base64Url = encodedUrl.replace(/-/g, '+').replace(/_/g, '/')

    // Use Buffer for base64 decoding in Node.js
    let targetUrl = Buffer.from(base64Url, 'base64').toString('utf-8')
    console.log(`[Custom Proxy] Decoded URL: ${targetUrl}`)

    // Force HTTPS for the target URL
    const urlObj = new URL(targetUrl)
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:'
      targetUrl = urlObj.toString()
      console.log(`[Custom Proxy] Forced HTTPS: ${targetUrl}`)
    }

    const userAgent = req.query.ua
    console.log(`[Custom Proxy] User-Agent: ${userAgent}`)

    if (!targetUrl || !userAgent) {
      return res.status(400).send('Missing target URL or User-Agent')
    }

    console.log(`[Custom Proxy] Fetching ${targetUrl} with User-Agent: ${userAgent}`)

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': userAgent,
        // Forward common headers from browser for better site compatibility
        Accept:
          req.headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.5',
        // Don't forward Cookie header for security reasons
      },
      redirect: 'follow', // Handle redirects
    })

    // Forward status code
    res.status(response.status)

    // Check the content type
    const contentType = response.headers.get('content-type') || ''
    const isHtml = contentType.includes('text/html')

    // Forward headers from the target site
    for (const [name, value] of Object.entries(response.headers.raw())) {
      // Skip headers that might cause issues
      if (!['content-encoding', 'transfer-encoding', 'connection', 'keep-alive'].includes(name.toLowerCase())) {
        res.setHeader(name, value)
      }
    }

    if (isHtml) {
      // For HTML content, rewrite HTTP links to HTTPS
      const text = await response.text()

      // Replace http:// with https:// in URLs, but be careful with data: and other protocols
      const rewritten = text
        .replace(/\bhttp:\/\//g, 'https://')
        // Also rewrite links in HTML attributes
        .replace(/\bhref=["']http:\/\//g, 'href="https://')
        .replace(/\bsrc=["']http:\/\//g, 'src="https://')
        .replace(/\burl\(["']?http:\/\//g, 'url("https://')

      res.send(rewritten)
    } else {
      // For non-HTML content, stream directly
      response.body.pipe(res)
    }
  } catch (error) {
    console.error('[Custom Proxy] Error:', error)
    res.status(500).send(`Error fetching the URL: ${error.message}`)
  }
})

// 404 handler at the end
app.use((_, res) => res.status(404).render('404'))

const httpServer = createServer()

httpServer.on('request', (req, res) => {
  console.log(`[Request] ${req.method} ${req.url}`)

  // Check if this is a custom-proxy request
  if (req.url.startsWith('/custom-proxy-handler.html/')) {
    console.log('[Request] Routing to custom proxy handler')
    return app(req, res)
  }

  if (bare.shouldRoute(req)) {
    console.log('[Request] Routing to bare server')
    bare.routeRequest(req, res)
  } else {
    console.log('[Request] Routing to express app')
    app(req, res)
  }
})

httpServer.on('error', (err) => console.log(err))
httpServer.on('upgrade', (req, socket, head) => {
  if (bare.shouldRoute(req)) bare.routeUpgrade(req, socket, head)
  else socket.end()
})

httpServer.listen({ port: process.env.PORT || 8080 }, () => {
  const addr = httpServer.address()
  console.log(`\x1b[42m\x1b[1m shuttle\n Port: ${addr.port}\x1b[0m`)
})

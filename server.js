#!/usr/bin/env node

const os = require('os')
const path = require('path')
const http = require('http')

const ecstatic = require('ecstatic')
const WebSocket = require('ws')
const browserify = require('browserify')
const watchify = require('watchify')

if (process.argv.length !== 3) {
  console.error('usage: you-win app.js')
  process.exit(1)
}
const gamePath = path.join(process.cwd(), process.argv[2])
require('fs').readFileSync(gamePath)
const b = browserify({
  entries: [gamePath],
  cache: {},
  packageCache: {},
})
// TODO transform
b.plugin(watchify, {
  ignoreWatch: ['**/node_modules/**'],
  standalone: 'app',
  poll: true, // because NFS
  detectGlobals: false, // faster
  debug: true, // source maps
})

// static files & app.js are relative to the cwd
const serveStatic = ecstatic({
  root: path.join(process.cwd(), 'static/'),
  handleError: false,
  showDir: false,
  showDotfiles: false,
  cache: 0,
})

// builtins are relative to the you-win installation
const serveBuiltin = ecstatic({
  root: path.join(path.dirname(__filename), 'builtin/'),
  handleError: false,
  showDir: false,
  showDotfiles: false,
  cache: 3600,
})

const moo = (req, res) => {
  const stat = fileSystem.statSync(filePath)
}

const app = (req, res) => {
  return serveStatic(req, res, fail => {
    serveBuiltin(req, res, fail => {
      // TODO randomize version param in index.html
      if (req.url === '/app.js' || /^\/app\.js\?/.test(req.url)) {
        res.writeHead(200, {
          'Content-Type': 'text/javascript',
          'Cache-Control': 'max-age=0',
        })
        const stream = b.bundle()
        stream.pipe(res)
        stream.on('error', err => {
          console.error('error:', err.message)
          res.write('console.error(' + JSON.stringify(err.message) + ')\n')
          res.end()
        })
        // const fs = require('fs')
        // b.bundle().pipe(fs.createWriteStream('moo.js'))
        // res.end()

      } else {
        res.end('not found: ' + req.url)
      }
    })
  })
}

const sockets = new Set()
const socket = (ws, req) => {
  sockets.add(ws)
  ws.on('close', () => sockets.delete(ws))
}

b.on('update', () => {
  console.log('refreshed')
  sockets.forEach(ws => {
    try {
      ws.send(JSON.stringify({_type: 'refresh'}))
    } catch (e) {
      sockets.delete(ws)
    }
  })
})


const interfaces = os.networkInterfaces()
const externalIps = ['localhost']
Object.keys(interfaces).forEach(key => {
  interfaces[key].forEach(eth => {
    if (eth.internal === false && eth.family === 'IPv4') {
      externalIps.push(eth.address)
    }
  })
})

const PORT = process.env.PORT || 8000
externalIps.forEach(host => {
  const server = http.createServer(app)
  const wsServer = new WebSocket.Server({server})
  wsServer.on('connection', socket)

  server.listen(PORT, host, () => {
    const {address, port} = server.address()
    if (address !== '127.0.0.1') {
      console.log('running at http://' + address + ':' + port)
    }
  })
})


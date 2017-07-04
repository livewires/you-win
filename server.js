#!/usr/bin/env node

const os = require('os')
const path = require('path')
const fs = require('fs')
const http = require('http')
const ecstatic = require('ecstatic')
const WebSocket = require('ws')

if (process.argv.length !== 3) {
  console.error('usage: you-win app.js')
  process.exit(1)
}
const gamePath = path.join(process.cwd(), process.argv[2])

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
      if (req.url === '/app.js') {
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end(gameContent)
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

var gameContent = fs.readFileSync(gamePath, 'utf-8')
var watcher = fs.watch(gamePath, throttle)
var timeout
function throttle() {
  clearTimeout(timeout)
  timeout = setTimeout(refresh, 10)
}
function refresh() {
  // fs.watch often gives extra notifications :-(
  const newContent = fs.readFileSync(gamePath, 'utf-8')
  if (gameContent === newContent) return
  gameContent = newContent

  console.log('refreshed')
  sockets.forEach(ws => {
    try {
      ws.send(JSON.stringify({_type: 'refresh'}))
    } catch (e) {
    }
    sockets.delete(ws)
  })
  watcher.close()
  watcher = fs.watch(gamePath, throttle)
}


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


#!/usr/bin/env node

const fs = require('fs')
const os = require('os')
const path = require('path')
const http = require('http')
const stream = require("stream")

const ecstatic = require('ecstatic')
const WebSocket = require('ws')
const browserify = require('browserify')
const watchify = require('watchify')


let command
let gamePath
switch (process.argv[2]) {
  case 'bundle':
  case 'bundle-uw':
    command = process.argv[2]
    if (process.argv.length !== 4) {
      console.error('usage: you-win ' + command + ' app.js')
      process.exit(1)
    }
    gamePath = path.join(process.cwd(), process.argv[3])
    break

  default:
    command = 'serve'
    if (process.argv.length !== 3) {
      console.error('usage: you-win app.js')
      process.exit(1)
    }
    gamePath = path.join(process.cwd(), process.argv[2])

  if (!fs.existsSync(gamePath)) {
      fs.writeFileSync(gamePath, fs.readFileSync(path.join(__dirname, 'template.js')))
      console.log('CREATED `' + process.argv[2] + '` from template!')
  }
}

const topLevelAwait = (b, opts) => {
  return new stream.Transform({
    transform: function(chunk, encoding, next) {
      if (!this._prefixed) {
        this.push('(async () => {')
        this._prefixed = true
      }
      this.push(chunk)
      next()
    },
    flush: function() {
      this.push('})()')
      this.push(null)
    },
  })
}

const uw = browserify({
    //detectGlobals: false, // faster
    debug: true, // source maps
})
.require(path.join(__dirname, './uw'), {expose: 'you-win'})

const game = browserify({
    entries: [gamePath],
    cache: {},
    packageCache: {},
    //detectGlobals: false, // faster
    debug: true, // source maps
})
.transform(topLevelAwait)
.external(uw)
.plugin(watchify, {
    ignoreWatch: ['**/node_modules/**'],
    poll: true, // because NFS
})

// We must call this up-front, otherwise we can't generate the game's bundle.
uw.bundle()

// allow static bundling
if (command === 'bundle') {
  const stream = game.bundle()
  stream.pipe(process.stdout)
  stream.on('error', err => {
    console.error(err)
  })
  stream.on('end', err => {
    process.exit(0)
  })

} else if (command === 'bundle-uw') {
  const stream = uw.bundle()
  stream.pipe(process.stdout)
  stream.on('error', err => {
    console.error(err)
  })
  stream.on('end', err => {
    process.exit(0)
  })

} else {

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

  const app = (req, res) => {
      return serveStatic(req, res, fail => {
          serveBuiltin(req, res, fail => {
              // TODO randomize version param in index.html
              if (req.url === '/app.js' || /^\/app\.js\?/.test(req.url)) {
                  res.writeHead(200, {
                      'Content-Type': 'text/javascript',
                      'Cache-Control': 'max-age=0',
                  })
                  const stream = game.bundle()
                  stream.pipe(res)
                  stream.on('error', err => {
                      console.error('error:', err.message)
                      res.write('console.error(' + JSON.stringify(err.message) + ')\n')
                      res.end()
                  })
                  // const fs = require('fs')
                  // b.bundle().pipe(fs.createWriteStream('moo.js'))
                  // res.end()

              } else if (req.url === '/uw.js') {
                  res.writeHead(200, {
                      'Content-Type': 'text/javascript',
                      'Cache-Control': 'max-age=0',
                  })
                  const stream = uw.bundle()
                  // TODO: cache this.
                  stream.pipe(res)
                  stream.on('error', err => {
                      console.error('error:', err.message)
                      res.write('console.error(' + JSON.stringify(err.message) + ')\n')
                      res.end()
                  })

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

  game.on('update', () => {
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

}

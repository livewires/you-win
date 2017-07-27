
const emitter = require('./emitter')



const Request = function(def) {
  if (def) {
    def(result => this.emit('load', result), error => this.emit('error', result))
  }
  this.loaded = 0
  this.total = null
  this.lengthComputable = false
}
emitter(Request.prototype)

Request.prototype.then = function(cb) {
  var f = new Request
  this.on('load', result => {
    const next = cb(result)
    if (next instanceof Request) {
      next.on('load', next => f.emit('load', next))
    } else {
      f.emit('load', next)
    }
  })
  this.on('error', e => f.emit('error', e))
  this.on('progress', e => f.emit('progress', e))
  return f
}

Request.getURL = function(path, type) {
  const req = new Request
  const xhr = new XMLHttpRequest
  xhr.open('GET', path)
  xhr.responseType = type || 'arraybuffer'
  xhr.addEventListener('load', e => req.emit('load', xhr.response))
  xhr.addEventListener('progress', e => {
    req.loaded = e.loaded
    req.total = e.total
    req.lengthComputable = e.lengthComputable
    req.emit('progress')
  })
  xhr.addEventListener('error', e => req.emit('error', err))
  xhr.send()
  return req
}


const Asset = function() {
}
Asset.map = Object.create(null)

Asset.load = Request.getURL

Asset.init = function(promiseMap) {
  const promises = []
  for (let key of Object.keys(promiseMap)) {
    var promise = promiseMap[key]
    if (!promise.then) {
      promise = Costume.load(promise)
      if (!promise.then) {
        throw new Error("oops")
      }
    }
    promise.then(result => {
      Asset.map[key] = result
    })
    promises.push(promise)
  }

  const loaded = Promise.all(promises)
  return {
    then: cb => {
      loaded.then(cb)
      .catch(err => {
        console.error(err)
      })
    },
  }
}

Asset.get = function(name) {
  return Asset.map[name]
}



module.exports = {Asset, Request}


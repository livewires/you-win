
const emitter = require('./emitter')



const Request = function(def) {
    if (def) {
        def(result => this.emit('load', result), error => this.emit('error', result))
    }
    this.loaded = 0
    this.total = null
    this.lengthComputable = false
    this.on('progress', e => {
        this.loaded = e.loaded
        this.total = e.total
        this.lengthComputable = e.lengthComputable
    })
}
emitter(Request.prototype)

Request.prototype.then = function(cb) {
    var f = new Request
    this.on('load', result => {
        const next = cb(result)
        if (next instanceof Request) {
            next.on('load', next => f.emit('load', next))
        } else {
            // TODO catch ?
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
        req.emit('progress', {
            loaded: e.loaded,
            total: e.total,
            lengthComputable: e.lengthComputable,
        })
    })
    xhr.addEventListener('error', e => req.emit('error', err))
    xhr.send()
    return req
}


const Asset = function() {
}

Asset.loadAll = function(promiseMap, defaultFactory) {
    const comp = new Request
    const promises = []
    const results = {}
    for (let key of Object.keys(promiseMap)) {
        var promise = promiseMap[key]
        if (!promise.then) {
            promise = defaultFactory(promise)
        }
        promise.then(value => {
            count -= 1
            results[key] = value
            if (count === 0) {
                comp.emit('load', results)
            }
        })
        promise.on('progress', updateProgress)
        promises.push(promise)
    }
    var count = promises.length

    function updateProgress() {
        var computable = 0
        var loaded = 0
        var total = 0
        for (let req of promises) {
            if (req.lengthComputable) {
                computable += 1
                loaded += req.loaded
                total += req.total
            }
        }
        comp.emit('progress', {
            loaded: loaded,
            total: computable ? (total / computable * promises.length)|0 : promises.length,
        })
    }

    return comp
}

Asset.get = function(name) {
    return Asset.map[name]
}



module.exports = {Asset, Request}


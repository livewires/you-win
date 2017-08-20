
const emitter = require('./emitter')



const Request = function(def) {
    if (def) {
        def(result => this.emitLoad(result), error => this.emitError(result))
    }
    this.loaded = 0
    this.total = null
    this.lengthComputable = false
    this.onProgress(e => {
        this.loaded = e.loaded
        this.total = e.total
        this.lengthComputable = e.lengthComputable
    })
}
emitter(Request.prototype, ['progress', 'load', 'error'])

Request.prototype.then = function(cb) {
    var f = new Request
    this.onLoad(result => {
        const next = cb(result)
        if (next instanceof Request) {
            next.onLoad(next => f.emitLoad(next))
        } else {
            // TODO catch ?
            f.emitLoad(next)
        }
    })
    this.onError(e => f.emitError(e))
    this.onProgress(e => f.emitProgress(e))
    return f
}

Request.getURL = function(path, type) {
    const req = new Request
    const xhr = new XMLHttpRequest
    xhr.open('GET', path)
    xhr.responseType = type || 'arraybuffer'
    xhr.addEventListener('load', e => req.emitLoad(xhr.response))
    xhr.addEventListener('progress', e => {
        req.emitProgress({
            loaded: e.loaded,
            total: e.total,
            lengthComputable: e.lengthComputable,
        })
    })
    xhr.addEventListener('error', e => req.emitError(err))
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
                comp.emitLoad(results)
            }
        })
        promise.onProgress(updateProgress)
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
        comp.emitProgress({
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


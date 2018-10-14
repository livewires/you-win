'use strict'

const emitter = require('./emitter')
const textMetrics = require('./metrics')
const {emojiList, splitEmoji, testEmoji} = require('./emojis')
const {Asset, Request} = require('./assets')


let num = x => {
    const n = +x
    if (isNaN(n)) throw new Error('not a number: ' + x)
    return n
}
let round = x => {
    const n = num(x)
    return n < 0 ? (n - 0.5)|0 : (n + 0.5)|0
}
let bool = x => !!x
let str = x => {
    if (x === null) return ''
    if (typeof x !== 'string') throw new Error("not a string: " + x)
    return x
}
let array = x => {
    if (!Array.isArray(x)) throw new Error('oh dear')
    return x
}

function prop(O, name, normalise, onChange) {
    Object.defineProperty(O.prototype, name, {
        get: function() { return this['_' + name] },
        set: function(value) {
            var oldValue = this['_' + name]
            var value = this['_' + name] = normalise(value)
            if (value !== oldValue) {
                if (onChange) onChange.call(this, value, oldValue)
            }
        },
        enumerable: true,
        configurable: true,
    })
}

function bboxProp(O, name, set) {
    Object.defineProperty(O.prototype, name, {
        get: function() {
            if (!this._validBBox) this._computeBBox()
            return this['_' + name]
        },
        set: function(value) { set.call(this, num(value)) },
        enumerable: true,
        configurable: true,
    })
}


/* init */

const globalPromiseMap = {}

// load adds the name/path to a global; all costumes are then loaded in
// parallel when init() is called
function loadCostume(name, path) {
    globalPromiseMap[name] = Costume.load(path)
}

function loadSound(name, path) {
    globalPromiseMap[name] = Sound.load(path)
}

var world
var assets
function init(promiseMap) {
    // destroy old world!
    if (world) {
        world.destroy()
        console.clear()
    }

    const map = Object.assign({}, globalPromiseMap, promiseMap, {
        _text: Costume.load('munro.png'),
        _emoji: emojiList && Costume.load('emoji.png'),
    })

    const bar = document.querySelector('.progress') || document.createElement('div')
    bar.className = 'progress'
    document.body.appendChild(bar)
    bar.style.width = '5%'

    return Asset.loadAll(map, Costume.load)
        .onProgress(e => {
            var frac = e.loaded / e.total
            bar.style.width = (frac * 100) + '%';
        })
        .then(results => {
            bar.style.width = '100%'
            bar.style.opacity = 0
            assets = results
        })
}


/* Phone */

const Phone = function() {
    if (this === undefined) { throw new Error('requires `new` keyword') }

    this.hasTouch = navigator.maxTouchPoints > 0
    this.hasMultiTouch = navigator.maxTouchPoints > 1

    this.hasMotion = undefined
    this.motion = {x: 0, y: 0, z: 0}
    this.zAngle = 0
    this.zForce = 0

    if (!this.hasMultiTouch) {
        console.warn("This doesn't seem to be a phone: no multi-touch")
    }

    var gn = new GyroNorm()
    gn.init().then(() => {
        gn.start(data => {
            if (data.dm.gx == 0 && data.dm.gy == 0 && data.dm.gz == 0) {
                if (this.hasMotion === undefined) {
                    this.hasMotion = false
                    //alert('not a phone')
                }
                return
            }
            this.hasMotion = true

            const dm = data.dm
            this.motion = {x: dm.gx, y: dm.gy, z: dm.gz}
            const hasGyro = dm.x != null
            const gx = hasGyro ? dm.gx - dm.x : dm.gx
            const gy = hasGyro ? dm.gy - dm.y : dm.gy
            const gz = hasGyro ? dm.gz - dm.z : dm.gz
            const planar = maths.dist(gx, gy) || 0
            const ratio = Math.abs(gz) / planar
            var mag = 1 / (1 + ratio) || 0
            this.zForce = mag
            this.zAngle = mag == 0 ? 0 : maths.atan2(gx, gy)
            //debug.textContent = JSON.stringify({motion: this.motion,zAngle: this.zAngle,rotation:data.do, mag:this.zMagnitude}).replace(/,/g, '\n') + '\nusing gravity' 
        })
    }).catch(e => {
        //alert('not a phone')
    })
}


/* World */

var World = function(props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    world = this

    this._wrap = document.createElement('div')
    this._wrap.style.position = 'absolute'
    this._wrap.style.overflow = 'hidden'
    this._wrap.style.boxShadow = '0 0 0 1px rgba(0, 0, 0, .4)'
    this._wrap.appendChild(this._root = document.createElement('div'))
    this._root.style.position = 'absolute'
    this._root.appendChild(this._canvas = document.createElement('canvas'))
    this._canvas.style.imageRendering = 'pixelated'
    this._canvas.style.imageRendering = 'crisp-edges'
    this._canvas.style.imageRendering = '-moz-crisp-edges'
    this._context = this._canvas.getContext('2d')
    document.body.style.padding = '0px'
    document.body.style.margin = '0px'
    document.body.appendChild(this._wrap)
    this._resize()

    window.addEventListener('resize', () => { this._needsResize = true })
    this._bindPointer()

    //const de = document.documentElement
    Object.assign(this, {
        background: '#fff',
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: 0,
        scrollY: 0,
    }, props)
    this.sprites = []

    this._frame = this._frame.bind(this)
    this.start = this.start.bind(this)
    this.pause = this.pause.bind(this)
    this.stop = this.stop.bind(this)
    this.start()
}
emitter(World.prototype, ['tick', 'tap', 'drag', 'drop'])

World.prototype.start = function() {
    if (this.isRunning) return
    this.isRunning = true
    this._ticks = 0
    this._lastFrame = +new Date()
    requestAnimationFrame(this._frame.bind(this))

    window.addEventListener('blur', this.pause)
    window.addEventListener('focus', this.start)
}

World.prototype.pause = function() {
    this.isRunning = false
}

World.prototype.stop = function() {
    if (!this.isRunning) return
    this.pause()
    for (let s of this.sprites) {
        s.destroy()
    }

    window.removeEventListener('blur', this.pause)
    window.removeEventListener('focus', this.start)
}

World.prototype.destroy = function() {
    this.stop()
    for (let s of this.sprites) {
        s.destroy()
    }
    document.body.removeChild(this._wrap)
    world = null
}

World.prototype._resize = function() {
    this._wrap.style.width = this.width + 'px'
    this._wrap.style.height = this.height + 'px'
    const s = Math.min(window.innerWidth / this.width, window.innerHeight / this.height)
    const x = ((window.innerWidth - this.width * s) / 2)|0
    const y = ((window.innerHeight - this.height * s) / 2)|0
    this._wrap.style.transform = (
        'translate(' + x + 'px, ' + y + 'px) ' +
        'scale(' + s + ')'
    )
    this._wrap.style.transformOrigin = '0 0'
    this.scale = s
    this.translateX = x
    this.translateY = y
    this._needsResize = false
    this._canvas.width = this.width
    this._canvas.height = this.height
}

World.prototype._frame = function() {
    // abort when stop()'d
    if (!this.isRunning) return

    var now = +new Date()
    const ms = (now - this._lastFrame)
    this._lastFrame = now
    this._ticks += ms * (60 / 1000)
    var t = 0
    for ( ; this._ticks >= 1; this._ticks--) {
        // fire forever() loops
        this._tick()
        t++
    }

    // clear screen & render all sprites
    this._draw()

    requestAnimationFrame(this._frame)
}

World.prototype._tick = function() {
    // trigger `forever` loops
    this.tick()
    const sprites = this.sprites
    for (var i=0; i<sprites.length; i++) {
        sprites[i].tick()
    }
}
World.prototype.tick = function(cb) {
    // TODO opt?
    var dead = []
    for (let fn of this.listeners('tick')) {
        if (fn() === false) {
            dead.push(fn)
        }
    }
    for (let fn of dead) this.unlisten('tick', fn)
}
World.prototype.forever = World.prototype.onTick

World.prototype._draw = function() {
    if (this._needsResize) this._resize()

    this._context.clearRect(0, 0, this.width, this.height)
    this._context.imageSmoothingEnabled = false

    const sprites = this.sprites
    for (var i=0; i<sprites.length; i++) {
        const sprite = sprites[i]
        if (sprite._validBBox && !sprite.isOnScreen()) {
            // avoid expensive bbox computation
            continue
        }

        // add height because the Y-origin should start at the bottom, not the top
        sprite._draw(this._context, -this._scrollX|0, (this._height + this._scrollY)|0)
    }
}

prop(World, 'width', round, function() { this._needsResize = true })
prop(World, 'height', round, function() { this._needsResize = true })
prop(World, 'scrollX', num, function() { this._fixFingers() })
prop(World, 'scrollY', num, function() { this._fixFingers() })
prop(World, 'background', str, function(background) {
    this._wrap.style.background = background
})
prop(World, 'title', str, title => {
    document.title = title
})

World.prototype._bindPointer = function(e) {
    this._wrap.setAttribute('touch-action', 'none')
    this._wrap.style.touchAction = 'none'
    this._wrap.addEventListener('pointerdown', this.pointerDown.bind(this))
    this._wrap.addEventListener('pointermove', this.pointerMove.bind(this))
    this._wrap.addEventListener('pointerup', this.pointerUp.bind(this))
    this._wrap.addEventListener('pointercancel', this.pointerUp.bind(this))
    this._fingers = {}

    // disable double-tap zoom
    document.addEventListener('touchstart', e => e.preventDefault())
}

World.prototype._toWorld = function(sx, sy) {
    return {
        x: (sx - this.translateX) / this.scale + this._scrollX,
        y: this._height - (sy - this.translateY) / this.scale + this._scrollY,
    }
}

World.prototype._fixFingers = function() {
    for (const key in this._fingers) {
        const finger = this._fingers[key]
        const pos = this._toWorld(finger._clientX, finger._clientY)
        finger.fingerX = pos.x
        finger.fingerY = pos.y
    }
}

World.prototype.getFingers = function() {
    const fingers = this._fingers
    const out = []
    for (const key in fingers) {
        out.push(fingers[key])
    }
    return out
}

World.prototype.pointerDown = function(e) {
    if (!this.isRunning) return
    const pos = this._toWorld(e.clientX, e.clientY)
    this._fingers[e.pointerId] = {
        finger: e.pointerId,
        startX: pos.x,
        startY: pos.y,
        fingerX: pos.x,
        fingerY: pos.y,
        _clientX: e.clientX,
        _clientY: e.clientY,
    }
}

World.prototype.pointerMove = function(e) {
    if (!this.isRunning) return
    const finger = this._fingers[e.pointerId]
    if (!finger) return
    finger._clientX = e.clientX
    finger._clientY = e.clientY
    const pos = this._toWorld(e.clientX, e.clientY)
    finger.deltaX = pos.x - finger.fingerX
    finger.deltaY = pos.y - finger.fingerY
    finger.fingerX = pos.x
    finger.fingerY = pos.y

    // already dragging?
    if (finger.sprite) {
        if (finger.canceled) {
            return
        }
        if (finger.sprite.emitDrag(finger) === false) {
            finger.canceled = true
        }
        return
    }

    // start drag if moved
    const threshold = e.pointerType === 'mouse' ? 4 : 10
    if (maths.dist(pos.x - finger.startX, pos.y - finger.startY) < threshold) {
        return
    }

    // include delta from the events we skipped
    finger.wasDragged = true
    finger.deltaX = pos.x - finger.startX
    finger.deltaY = pos.y - finger.startY

    const sprites = this.sprites
    for (var i=sprites.length; i--; ) {
        const s = sprites[i]
        if (s.opacity !== 0 && s.touchesPoint(pos.x, pos.y)) {
            if (s.emitDrag(finger)) { // true
                finger.sprite = s
                return
            }
        }
    }
    this.emitDrag(finger)
    finger.sprite = this
}

World.prototype.pointerUp = function(e) {
    if (!this.isRunning) return
    const finger = this._fingers[e.pointerId]
    if (!finger) return
    delete this._fingers[e.pointerId]
    const pos = this._toWorld(e.clientX, e.clientY)
    if (finger.wasDragged) {
        finger.sprite.emitDrop(finger)
    } else {
        const sprites = this.sprites
        for (var i=sprites.length; i--; ) {
            const s = sprites[i]
            if (s.opacity !== 0 && s.touchesPoint(pos.x, pos.y)) {
                if (s.emitTap(finger)) { // true
                    return
                }
            }
        }
        this.emitTap(finger)
    }
}


/* Costume */

const Costume = function(canvas) {
    if (!canvas) throw new Error('no canvas')
    this._canvas = canvas
    this.width = canvas.width
    this.height = canvas.height
    this.xOffset = -this.width / 2 // left - center
    this.yOffset = -this.height / 2 // top - center
    this._context = canvas.getContext('2d')
}

Costume.blank = new Costume(document.createElement('canvas'))

Costume.prototype.draw = function(context, x=0, y=0) {
    context.drawImage(this._canvas, x, y)
}

Costume.prototype.isOpaqueAt = function(x, y) {
    const d = this._context.getImageData(x, y, 1, 1).data
    return d[3] !== 0
}

Costume.fromImage = function(img) {
    var canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    return new Costume(canvas)
}

Costume.fromBlob = function(blob) {
    const url = URL.createObjectURL(blob)
    const img = new Image
    img.crossOrigin = 'anonymous'
    img.src = url ///^http/.test(url) ? 'http://crossorigin.me/' + url : url
    return new Request((load, error) => {
        img.addEventListener('load', () => {
            URL.revokeObjectURL(url)
            load(Costume.fromImage(img))
        })
        img.addEventListener('error', e => error(e))
    })
}

Costume.load = function(url) {
    return Request.getURL(url, 'blob')
        .then(Costume.fromBlob)
}

Costume.get = function(name) {
    if (name === '') {
        return Costume.blank
    } else if (name.constructor === Costume || name.constructor === SliceCostume) {
        return name
    } else if (testEmoji.test(name)) {
        return Costume._emoji(name)
    } else if (assets[name]) {
        return assets[name]
    } else {
        throw new Error('unknown costume: ' + name)
    }
}

Costume.prototype.slice = function(props) {
    // (xSize + xMargin) * xCount = width
    // xSize = width / xCount - xMargin
    // (xSize + xMargin) * xCount = width
    var props = Object.assign({
        index: 0,
        xSize: null,
        ySize: null,
        xCount: null,
        xMargin: 0,
        yMargin: 0,
    }, props)
    const index = props.index
    props.xSize = props.xSize || this.width / props.xCount - props.xMargin
    props.ySize = props.ySize || this.height / props.yCount - props.yMargin
    props.xCount = props.xCount || this.width / (props.xSize + props.xMargin)
    const result = {}
    const x = (props.xSize + props.xMargin) * (index % props.xCount)
    const y = (props.ySize + props.yMargin) * Math.floor(index / props.xCount)

    return new SliceCostume(this, x, y, props.xSize, props.ySize)
}


const SliceCostume = function(source, x, y, w, h) {
    this._source = source
    this._x = x
    this._y = y
    this.width = w
    this.height = h
    this.xOffset = -this.width / 2
    this.yOffset = -this.height / 2
}

SliceCostume.prototype.draw = function(context, x=0, y=0) {
    const w = this.width, h = this.height
    context.drawImage(this._source._canvas, this._x, this._y, w, h, x, y, w, h)
}

SliceCostume.prototype.isOpaqueAt = function(x, y) {
    if (x < 0 || x > this.width || y < 0 || y > this.height) return false
    return this._source.isOpaqueAt(x + this._x, y + this._y)
}


/* Base */

const collisionCanvas = document.createElement('canvas')
const collisionContext = collisionCanvas.getContext('2d')
collisionContext.imageSmoothingEnabled = false
//collisionCanvas.style.border = '1px solid blue'

const Base = function(props, init) {
    // TODO transform on initial frame.
    if (this === undefined) { throw new Error('requires `new` keyword') }
    if (!world) { throw new Error('make World first') }
    this.world = world
    var props = props || {}

    this._validBBox = false
    this._left = false
    this._right = false
    this._bottom = false
    this._top = false

    this._angle = 0
    if (init) init.call(this, props)

    const s = props.scale || 1
    Object.assign(this, {
        posX: (world._width / 2 + world._scrollX)|0,
        posY: (world._height / 2 + world._scrollY)|0,
        scale: 1,
        opacity: 1,
        angle: 0,
        flipped: false,
    }, props)
    this.dead = false
    world.sprites.push(this)
}
emitter(Base.prototype, ['tick', 'tap', 'drag', 'drop'])

// TODO: cache rotated sprites.

Base.prototype._setCostume = function(costume) {
    // TODO don't destroy bbox if width/height is same?
    this._validBBox = false
}

prop(Base, 'x', num, function(x, oldX) {
    throw new Error("Sprite.x is not an attribute. Did you mean posX?")
})
prop(Base, 'y', num, function(x, oldX) {
    throw new Error("Sprite.y is not an attribute. Did you mean posY?")
})

prop(Base, 'posX', num, function(x, oldX) {
    if (this._validBBox) {
        const dx = x - oldX
        this._left += dx
        this._right += dx
    }
})
prop(Base, 'posY', num, function(y, oldY) {
    if (this._validBBox) {
        const dy = y - oldY
        this._top += dy
        this._bottom += dy
    }
})
prop(Base, 'scale', num, function() { this._validBBox = false })
prop(Base, 'angle', num, function() { this._validBBox = false })
prop(Base, 'flipped', bool)
prop(Base, 'opacity', num)

// TODO opt?
bboxProp(Base, 'left', function(left) {
    this.posX = left - this.scale * this._surface.xOffset
})
bboxProp(Base, 'right', function(right) {
    this.posX = right - this.scale * (this._surface.width + this._surface.xOffset)
})
bboxProp(Base, 'bottom', function(bottom) {
    this.posY = bottom + this.scale * (this._surface.height + this._surface.yOffset)
})
bboxProp(Base, 'top', function(top) {
    this.posY = top + this.scale * this._surface.yOffset
})

Base.prototype._computeBBox = function() {
    const costume = this._surface
    const s = this.scale
    if (this.angle === 0) {
        const x = this.posX + costume.xOffset * s
        const y = this.posY + costume.yOffset * s
        this._left = x
        this._bottom = y
        this._right = x + costume.width * s
        this._top = y + costume.height * s
    } else {
        const left = costume.xOffset * s
        const top = -costume.yOffset * s
        const right = left + costume.width * s
        const bottom = top - costume.height * s

        const dir = this.angle + 90
        const mSin = Math.sin(dir * Math.PI / 180)
        const mCos = Math.cos(dir * Math.PI / 180)

        const tlX = mSin * left - mCos * top
        const tlY = mCos * left + mSin * top

        const trX = mSin * right - mCos * top
        const trY = mCos * right + mSin * top

        const blX = mSin * left - mCos * bottom
        const blY = mCos * left + mSin * bottom

        const brX = mSin * right - mCos * bottom
        const brY = mCos * right + mSin * bottom

        this._left = this.posX + Math.min(tlX, trX, blX, brX)
        this._right = this.posX + Math.max(tlX, trX, blX, brX)
        this._top = this.posY + Math.max(tlY, trY, blY, brY)
        this._bottom = this.posY + Math.min(tlY, trY, blY, brY)
    }
    this._validBBox = true
}

Base.prototype.raise = function() {
    const sprites = this.world.sprites
    const index = sprites.indexOf(this)
    if (index === -1) return
    // avoid splice--shift 'em down ourselves
    for (var i = index; i<sprites.length - 1; i++) {
        sprites[i] = sprites[i + 1]
    }
    sprites[i] = this
}

Base.prototype.lower = function() {
    const sprites = this.world.sprites
    const index = sprites.indexOf(this)
    if (index === -1) return
    // avoid splice--shift 'em up ourselves
    for (var i = index; i > 0; i--) {
        sprites[i] = sprites[i - 1]
    }
    sprites[0] = this
}


Base.prototype.destroy = function() {
    if (this.dead) return
    this.dead = true
    var index = this.world.sprites.indexOf(this)
    if (index !== -1) {
        // assume destroy() is rare
        this.world.sprites.splice(index, 1)
    }
}

Base.prototype.isTouchingEdge = function() {
    if (!this._validBBox) this._computeBBox()
    const w = this.world._width, h = this.world._height
    const sx = this.world._scrollX, sy = this.world._scrollY
    return this._left <= +sx || this._right >= w + sx || this._bottom <= +sy || this._top >= h + sy
}

Base.prototype.isOnScreen = function() {
    if (!this._validBBox) this._computeBBox()
    const w = this.world._width, h = this.world._height
    const sx = this.world._scrollX, sy = this.world._scrollY
    return this._right > +sx && this._left < w + sx && this._top > +sy && this._bottom < h + sy
}

Base.prototype.touchesPoint = function(x, y) {
    if (!this._validBBox) this._computeBBox()
    if (x < this._left || y < this._bottom || x > this._right || y > this._top) {
        return false
    }
    const costume = this._surface
    var cx = (x - this._posX) / this.scale
    var cy = (this._posY - y) / this.scale // TODO
    if (this.angle !== 0) {
        const d = -this.angle * Math.PI / 180 // (dir = angle + 90)
        const ox = cx
        const s = Math.sin(d), c = Math.cos(d)
        cx = c * ox - s * cy
        cy = s * ox + c * cy
    }
    if (this.flipped) {
        cx = -cx //this._surface.width - cx
    }
    return costume.isOpaqueAt(cx - costume.xOffset, cy - costume.yOffset)
}

Base.prototype._draw = function(ctx, x=0, y=0) {
    const costume = this._surface
    ctx.save()
    ctx.translate(x + this._posX|0, y - this._posY|0)
    ctx.rotate(this._angle * Math.PI / 180)
    if (this._flipped) {
        ctx.scale(-1, 1)
    }
    ctx.scale(this._scale, this._scale)
    ctx.translate(costume.xOffset|0, costume.yOffset|0)
    ctx.globalAlpha = this._opacity
    costume.draw(ctx)
    ctx.restore()
}

Base.prototype.isTouchingFast = function(s) {
    if (!(s instanceof Base)) { throw new Error('not a sprite: ' + s) }
    if (s === this) return false
    if (s.opacity === 0) return false
    if (!this._validBBox) this._computeBBox()
    if (!s._validBBox) s._computeBBox()
    if (this._left >= s._right || this._right <= s._left || this._top <= s._bottom || this._bottom >= s._top) {
        return false
    }
    return true
}

Base.prototype.isTouching = function(s) {
    if (!this.isTouchingFast(s)) {
        return false
    }

    const left = Math.max(this._left, s._left)
    const top = Math.min(this._top, s._top)
    const right = Math.min(this._right, s._right)
    const bottom = Math.max(this._bottom, s._bottom)

    const cw = (right - left + 0.5)|0
    const ch = (top - bottom + 0.5)|0
    if (cw === 0 || ch === 0) {
        // avoid 'source height cannot be 0'
        return false
    }
    collisionCanvas.width = cw
    collisionCanvas.height = ch

    collisionContext.save()
    collisionContext.translate(-left, top)

    this._draw(collisionContext)
    collisionContext.globalCompositeOperation = 'source-in'
    s._draw(collisionContext)

    collisionContext.restore()

    var data = collisionContext.getImageData(0, 0, cw, ch).data

    var length = (right - left) * (top - bottom) * 4
    for (var j = 0; j < length; j += 4) {
        if (data[j + 3]) {
            return true
        }
    }
    return false
}

Base.prototype.getTouching = function() {
    const sprites = this.world.sprites
    const result = []
    for (var i=sprites.length; i--; ) {
        const s = sprites[i]
        if (this.isTouching(s)) {
            result.push(s)
        }
    }
    return result
}

Base.prototype.getTouchingFast = function() {
    const sprites = this.world.sprites
    const result = []
    for (var i=sprites.length; i--; ) {
        const s = sprites[i]
        if (this.isTouchingFast(s)) {
            result.push(s)
        }
    }
    return result
}

Base.prototype.tick = World.prototype.tick
Base.prototype.forever = Base.prototype.onTick


/* Sprite */

const Sprite = function(props) {
    var props = Object.assign({
        costume: '',
    }, props || {})
    Base.call(this, props, function(props) {
        this.costume = props.costume
    })
}
Sprite.prototype = Object.create(Base.prototype)

prop(Sprite, 'costume', str, function(costume) {
    this._setCostume(this._surface = Costume.get(costume))
})


/* Text */

function characters(text, emit) {
    var index = 0
    while (true) {
        var c = text.codePointAt(index++)
        if (c === undefined) break
        if (c === 13) {
            emit('\n') // TODO render newlines
        } else if (c < 256) { // '£' --> 163
            emit(String.fromCodePoint(c))
        } else {
            var emoji = String.fromCodePoint(c)
            index++ // utf-16
            while (text.codePointAt(index) >= 256) {
                emoji += String.fromCodePoint(text.codePointAt(index++))
                index++ // utf-16
            }
            emit(emoji)
        }
    }
}

Costume._emojiCache = Object.create(null)
Costume._emoji = function(emoji) {
    if (!assets._emoji) { throw new Error('emoji not available') }
    const index = emojiList.indexOf(emoji)
    if (index === -1) { throw new Error('unknown emoji: ' + emoji) }
    if (Costume._emojiCache[index]) {
        return Costume._emojiCache[index]
    }
    return Costume._emojiCache[index] = assets._emoji.slice({
        index: index,
        xSize: 32,
        ySize: 32,
        xMargin: 2,
        yMargin: 2,
        xCount: 30,
    })
}

Costume._text = function(props) {
    const text = '' + props.text
    const fill = props.fill !== '#000' && props.fill // ie. not default

    const fontMetrics = textMetrics.Munro
    const tw = 9
    const th = 11
    var x = 0
    const chars = []
    text.split(splitEmoji).forEach(c => {
        if (!c) return
        const metrics = fontMetrics[c] || fontMetrics[' ']
        let tile
        if (testEmoji.test(c)) {
            tile = Costume._emoji(c)
            chars.push({tile: Costume._emoji(c), x: x, scale: 1, isEmoji: true})
            x += 36
        } else {
            if (!fontMetrics[c]) {
                console.error('unknown characters:', c)
            }
            const tile = assets._text.slice({
                index: metrics.index,
                xSize: tw,
                ySize: th,
                xCount: 26,
            })
            chars.push({width: metrics.width, tile: tile, x: x - 3 * (metrics.dx || 0), scale: 3})
            x += metrics.width * 3
        }
    })

    const canvas = document.createElement('canvas')
    canvas.width = x || 1
    canvas.height = 36
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    if (fill) ctx.fillStyle = fill
    for (var i=chars.length; i--; ) {
        const glyph = chars[i]
        const costume = glyph.tile
        const s = glyph.scale
        ctx.save()
        ctx.translate(glyph.x, 0)
        ctx.scale(s, s)
        costume.draw(ctx)
        ctx.restore()

        if (fill && glyph.width) {
            ctx.globalCompositeOperation = 'source-atop'
            ctx.fillRect(glyph.x, 0, 3 * glyph.width, 36)
            ctx.globalCompositeOperation = 'source-over' // default
        }
    }

    return new Costume(canvas)
}

const Text = function(props) {
    var props = Object.assign({
        text: '',
        fill: '#000',
        scale: 1,
    }, props || {})
    //if (props.text === undefined) { throw new Error('Text needs text') }
    Base.call(this, props, function(props) {
        this._fill = props.fill
        this.text = props.text // draw shape
    })
}
Text.prototype = Object.create(Base.prototype)

Text.prototype._render = function() {
    this._setCostume(this._surface = Costume._text({
        text: this._text,
        fill: this._fill,
    }))
}
prop(Text, 'text', x => ''+x, Text.prototype._render)
prop(Text, 'fill', str, Text.prototype._render)


/* Polygon */

Costume._polygon = function(props) {
    const points = props.points
    const start = points[0]
    var minX = start.x || start[0]
    var minY = start.y || start[1]
    var maxX = minX
    var maxY = minY
    for (var i=1; i<points.length; i++) {
        const p = points[i], x = p.x || p[0], y = p.y || p[1]
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (-y < minY) minY = -y
        if (-y > maxY) maxY = -y
    }

    var margin = props.outline ? (props.thickness || 2) : 0
    minX -= round(margin)
    minY -= round(margin)
    maxX += round(margin)
    maxY += round(margin)

    const canvas = document.createElement('canvas')
    canvas.width = maxX - minX || 1
    canvas.height = maxY - minY || 1
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false

    if (!props.outline) {
        if (minX === maxX) console.warn("Polygon points have no width")
        if (minY === maxY) console.warn("Polygon points have no height")
    }

    ctx.translate(-minX, -minY)
    ctx.beginPath()
    ctx.moveTo(start.x || start[0], -(start.y || start[1]))
    for (var i=1; i<points.length; i++) {
        const p = points[i]
        ctx.lineTo(p.x || p[0], -(p.y || p[1]))
    }

    if (props.closed) {
        ctx.closePath()
    }
    if (props.fill) {
        ctx.fillStyle = props.fill
        ctx.fill()
    }
    if (props.outline) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = props.outline
        ctx.lineWidth = props.thickness
        ctx.stroke()
    }
    return new Costume(canvas)
}

const Polygon = function(props) {
    var props = Object.assign({
        points: [[0, 0], [0, 32], [32, 32], [32, 0]],
        fill: null,
        outline: null,
        thickness: 2,
        closed: undefined,
    }, props || {})
    if (props.closed === undefined) props.closed = !!props.fill
    Base.call(this, props, function(props) {
        this._fill = props.fill
        this._outline = props.outline
        this._thickness = props.thickness
        this._closed = props.closed
        this.points = props.points // draw shape
    })
}
Polygon.prototype = Object.create(Base.prototype)

Polygon.prototype._render = function() {
    this._setCostume(this._surface = Costume._polygon({
        fill: this._fill,
        outline: this._outline,
        thickness: this._thickness,
        closed: this._closed,
        points: this._points,
    }))
}
prop(Polygon, 'fill', str, Polygon.prototype._render)
prop(Polygon, 'outline', str, Polygon.prototype._render)
prop(Polygon, 'thickness', num, Polygon.prototype._render)
prop(Polygon, 'closed', bool, Polygon.prototype._render)
prop(Polygon, 'points', array, Polygon.prototype._render)


const Rect = function(props) {
    var props = Object.assign({
        width: 32,
        height: 32,
    }, props || {})
    if (props.closed === undefined) props.closed = !!props.fill
    this._closed = true
    Base.call(this, props, function(props) {
        this._fill = props.fill
        this._outline = props.outline
        this._thickness = props.thickness
        this._width = props.width
        this.height = props.height // draw shape
    })
}
Rect.prototype = Object.create(Base.prototype)

Rect.prototype._render = function() {
    this._points = [
        [0, 0],
        [this._width, 0],
        [this._width, this._height],
        [0, this._height],
    ]
    Polygon.prototype._render.call(this)
}
prop(Rect, 'fill', str, Rect.prototype._render)
prop(Rect, 'outline', str, Rect.prototype._render)
prop(Rect, 'thickness', num, Rect.prototype._render)
prop(Rect, 'width', num, Rect.prototype._render)
prop(Rect, 'height', num, Rect.prototype._render)


/* Sound */

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioContext = AudioContext && new AudioContext

if (audioContext) {
    var volumeNode = audioContext.createGain()
    volumeNode.gain.value = 1
    volumeNode.connect(audioContext.destination)
} else {
    console.warn('no audio support')
}

const Sound = function(buffer) {
    if (typeof buffer === 'string') var buffer = assets[buffer]
    this.buffer = buffer
}

Sound.load = function(path) {
    return Request.getURL(path, 'arraybuffer')
        .then(ab => new Request((load, error) => {
            audioContext.decodeAudioData(ab, buffer => {
                load(buffer)
            }, function(err) {
                console.warn('Failed to load audio')
                error(err)
            })
        }))
}

Sound.prototype.play = function() {
    if (!audioContext) return
    if (!this.buffer) return
    if (!this.node) {
        this.node = audioContext.createGain()
        this.node.gain.value = 1
        this.node.connect(volumeNode)
    }

    if (this.source) {
        this.source.disconnect()
    }
    this.source = audioContext.createBufferSource()
    this.source.buffer = this.buffer
    this.source.connect(this.node)

    this.source.start(audioContext.currentTime)
}




/* events */

var keyCodes = {
    up: 38,
    down: 40,
    left: 37,
    right: 39,
    space: 32,
    escape: 27,
    return: 13,
    backspace: 8,
    tab: 9,
}
for (var i=0; i<=10; i++) { keyCodes[''+i] = i + 48; }
for (var i=1; i<=12; i++) { keyCodes['F'+i] = i + 111; }
for (var i=65; i<=90; i++) { keyCodes[String.fromCharCode(i + 32)] = i; }


/* math */

const degrees = x => x * (180 / Math.PI)
const radians = x => x * (Math.PI / 180)

const maths = {
    sin: a => Math.sin(radians(a)),
    cos: a => Math.cos(radians(a)),
    atan2: (x, y) => degrees(Math.atan2(x, y)),
    dist: (dx, dy) => Math.sqrt(dx * dx + dy * dy),

    range: (start, end, step=1) => {
        if (end === undefined) [start, end] = [0, start]
        const out = []
        if (step > 0) for (var i = start; i < end; i += step) out.push(i)
        else for (var i = start; i > end; i += step) out.push(i)
        return out
    },

    /* random */
    randomInt: (from, to) => from + Math.floor(((to - from + 1) * Math.random())),
    randomChoice: array => array[Math.floor(Math.random() * array.length)],
}


module.exports = {
    init,
    begin: init,
    loadCostume,
    loadSound,

    Phone,
    World,
    Costume,
    Sprite,
    Text,
    Polygon,
    Rect,
    Sound,
}
Object.assign(module.exports, maths)


'use strict'

const emitter = require('./emitter')
const textMetrics = require('./metrics')
const emojiList = require('./emojis')

let num = x => +x
let round = x => x < 0 ? (x - 0.5)|0 : (x + 0.5)|0
let bool = x => !!x
let str = x => {
  if (typeof x !== 'string') throw new Error("not a string: " + x)
  return x
}

function prop(O, name, normalise, changed) {
  Object.defineProperty(O.prototype, name, {
    get: function() { return this['_' + name] },
    set: function(value) {
      var oldValue = this['_' + name]
      var value = this['_' + name] = normalise(value)
      if (value !== oldValue) {
        changed.call(this, value, oldValue)
      }
    },
    enumerable: true,
    configurable: true,
  })
}

function lazyProp(O, name, compute) {
  Object.defineProperty(O.prototype, name, {
    get: function() {
      return this['_' + name] || (this['_' + name] = compute.call(this))
    },
    enumerable: true,
    configurable: true,
  })
}

function bboxProp(O, name, set) {
  Object.defineProperty(O.prototype, name, {
    get: function() { return this.bbox[name] },
    set: function(value) { set.call(this, +value) },
    enumerable: true,
    configurable: true,
  })
}


/* init */

var world
var assets = Object.create(null)
function init(promiseMap) {
  // destroy old world!
  if (world) {
    world.destroy()
  }

  promiseMap['_text'] = Costume.load('munro.png')

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
      assets[key] = result
    })
    promises.push(promise)
  }
  return Promise.all(promises)
}

// TODO progress bar


/* Phone */

const Phone = function() {
  if (this === undefined) { throw new Error('requires `new` keyword') }
  
  this.hasTouch = navigator.maxTouchPoints > 0
  this.hasMultiTouch = navigator.maxTouchPoints > 1

  this.hasMotion = undefined
  this.motion = {x: 0, y: 0, z: 0}
  this.zAngle = 0
  this.zForce = 0
  
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
  document.body.style.padding = '0px'
  document.body.style.margin = '0px'
  document.body.appendChild(this._wrap)
  this._resize()
  this._needsScroll = true
  this._dead = false

  //const de = document.documentElement
  Object.assign(this, {
    background: '#fff',
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: 0,
    scrollY: 0,
  }, props)
  this.sprites = []

  window.addEventListener('resize', () => { this._needsResize = true })
  this._bindPointer()

  setTimeout(this.start.bind(this))
}
emitter(World.prototype)

World.prototype.destroy = function() {
  for (let s of this.sprites) {
    s.destroy()
  }
  document.body.removeChild(this._wrap)
  world = null
}

World.prototype._resize = function() {
  this._wrap.style.width = this.width + 'px'
  this._wrap.style.height = this.height + 'px'
  const s = Math.min(1, window.innerWidth / this.width, window.innerHeight / this.height)
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
}

World.prototype._scroll = function() {
  this._root.style.transform = 'translate(' + -this.scrollX + 'px, ' + -this.scrollY + 'px)'
  this._needsScroll = false
}

World.prototype.frame = function() {
  if (this._dead) return
  this.emit('frame')

  if (this._needsResize) this._resize()

  const didScroll = this._needsScroll
  if (this._needsScroll) this._scroll()

  const sprites = this.sprites
  for (var i=sprites.length; i--; ) {
    const sprite = sprites[i]
    if (sprite._needsPaint) sprite._paint()
    if (sprite._needsTransform) sprite._transform()

    // don't render offscreen sprites
    const show = sprite.isOnScreen()
    if (sprite._show !== show) {
      sprite._show = show
      // TODO change this to visibility
      sprite.el.style.display = show ? 'block' : 'none'
    }
  }

  requestAnimationFrame(this.frame.bind(this))
}
World.prototype.start = World.prototype.frame

prop(World, 'width', round, function() { this._needsResize = true })
prop(World, 'height', round, function() { this._needsResize = true })
prop(World, 'scrollX', round, function() { this._needsScroll = true })
prop(World, 'scrollY', round, function() { this._needsScroll = true })
prop(World, 'background', str, function(background) {
  this._wrap.style.background = background
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
    x: (sx - this.translateX) / this.scale + this.scrollX,
    y: this.height - ((sy - this.translateY) / this.scale + this.scrollY),
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
  const pos = this._toWorld(e.clientX, e.clientY)
  this._fingers[e.pointerId] = {
    finger: e.pointerId,
    startX: pos.x,
    startY: pos.y,
    fingerX: pos.x,
    fingerY: pos.y,
  }
}

World.prototype.pointerMove = function(e) {
  const finger = this._fingers[e.pointerId]
  if (!finger) return
  const pos = this._toWorld(e.clientX, e.clientY)
  finger.deltaX = pos.x - finger.fingerX
  finger.deltaY = pos.y - finger.fingerY
  finger.fingerX = pos.x
  finger.fingerY = pos.y

  // already dragging?
  if (finger.sprite) {
    finger.sprite.emit('drag', finger)
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
    if (s.opacity != 0 && s.touchesPoint(pos.x, pos.y)) {
      if (s.emit('drag', finger) === false) {
        finger.sprite = s
        return
      }
    }
  }
  this.emit('drag', finger)
  finger.sprite = this
}

World.prototype.pointerUp = function(e) {
  const finger = this._fingers[e.pointerId]
  if (!finger) return
  delete this._fingers[e.pointerId]
  const pos = this._toWorld(e.clientX, e.clientY)
  if (!finger.wasDragged) {
    const sprites = this.sprites
    for (var i=sprites.length; i--; ) {
      const s = sprites[i]
      if (s.opacity != 0 && s.touchesPoint(pos.x, pos.y)) {
        if (s.emit('tap', finger) === false) {
          return
        }
      }
    }
    this.emit('tap', finger)
  }
}


/* Costume */

const Costume = function(canvas) {
  if (!canvas) throw new Error('no canvas')
  this.canvas = canvas
  this.width = canvas.width
  this.height = canvas.height
  this.xOffset = -this.width / 2
  this.yOffset = -this.height / 2
  this.context = canvas.getContext('2d')
}

Costume.fromImage = function(img) {
  var canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return new Costume(canvas)
}

Costume.load = function(url, canvas) {
  const img = new Image
  img.crossOrigin = 'anonymous'
  img.src = url ///^http/.test(url) ? 'http://crossorigin.me/' + url : url
  return new Promise(resolve => {
    img.addEventListener('load', () => {
      resolve(Costume.fromImage(img))
    })
  })
}

Costume.get = function(name) {
  if (name.constructor === Costume) {
    return name
  } else {
    const costume = assets[name]
    if (!costume) {
      throw new Error('unknown costume: ' + name)
    }
    return costume
  }
}

Costume.emoji = function(emoji) {
  if (!emojiList) { throw new Error('emoji not available') }
  const index = emojiList.indexOf(emoji)
  if (index === -1) { throw new Error('unknown emoji: ' + emoji) }
  return Costume.load('emoji.png').then(sheet => {
    return sheet.slice({
      index: index,
      xSize: 32,
      ySize: 32,
      xMargin: 2,
      yMargin: 2,
      xCount: 30,
    })
  })
}

Costume._text = function(props) {
  const text = '' + props.text

  const fontMetrics = textMetrics.Munro
  const tw = 9
  const th = 10
  var x = 0
  const chars = []
  for (var i=0; i<text.length; i++) {
    const c = text[i]
    const metrics = fontMetrics[c] || fontMetrics[' ']
    // TODO drawImage directly from one canvas to the other
    const canvas = assets._text.slice({
      index: metrics.index,
      xSize: tw,
      ySize: th,
      xCount: 26,
    }).canvas
    chars.push({canvas: canvas, x: x - (metrics.dx || 0)})
    x += metrics.width
  }

  const canvas = document.createElement('canvas')
  canvas.width = x
  canvas.height = 10
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  for (var i=chars.length; i--; ) {
    const c = chars[i]
    ctx.drawImage(c.canvas, c.x, 0)
  }

  if (props.fill !== '#000') { // not default
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = props.fill
    ctx.fillRect(0, 0, x, th)
  }

  return new Costume(canvas)
}

Costume.polygon = function(props) {
  var props = Object.assign({
    points: [[0, 0], [0, 32], [32, 32], [32, 0]],
    fill: null,
    outline: null,
    thickness: 2,
    closed: undefined,
  }, props)
  if (props.closed === undefined) props.closed = !!props.fill
  if (!props.fill && !props.outline) {
    throw new Error('need either fill or outline colour')
  }

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

  var margin = props.outline ? props.thickness : 0
  minX -= round(margin)
  minY -= round(margin)
  maxX += round(margin)
  maxY += round(margin)

  const canvas = document.createElement('canvas')
  canvas.width = maxX - minX
  canvas.height = maxY - minY
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false

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
  const c = new Costume(canvas)
  c.xOffset = -minX - 2 * margin // 2*? weird.
  c.yOffset = -minY - 2 * margin
  return c
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

  const canvas = document.createElement('canvas')
  canvas.width = props.xSize
  canvas.height = props.ySize
  const ctx = canvas.getContext('2d')
  ctx.drawImage(this.canvas, -x|0, -y|0)
  return new Costume(canvas)
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

  this.el = document.createElement('canvas')
  this.ctx = this.el.getContext('2d')
  this.el.style.position = 'absolute'
  this.el.style.WebkitUserDrag = 'none'
  this.el.style.userDrag = 'none' // ??
  this.el.style.imageRendering = 'pixelated'
  this.el.style.imageRendering = 'crisp-edges'
  this.el.style.imageRendering = '-moz-crisp-edges'

  this._angle = 0
  if (init) init.call(this, props)

  const s = props.scale || 1
  Object.assign(this, {
    x: (world.width / 2 - world.scrollX)|0,
    y: (world.height / 2 - world.scrollY)|0,
    scale: 1,
    opacity: 1,
    angle: 0,
    flipped: false,
  }, props)
  this.dead = false
  world.sprites.push(this)
  this.raise()
}
emitter(Base.prototype)

Base.prototype._setCostume = function(costume) {
  this.el.width = costume.width
  this.el.height = costume.height
  this.ctx.drawImage(costume.canvas, 0, 0)
  this._bbox = null
}

prop(Base, 'x', round, function() { this._needsTransform = true; this._bbox = null })
prop(Base, 'y', round, function() { this._needsTransform = true; this._bbox = null })
prop(Base, 'scale', num, function() { this._needsTransform = true; this._bbox = null })
prop(Base, 'angle', num, function() { this._needsTransform = true; this._bbox = null })
prop(Base, 'flipped', bool, function() { this._needsTransform = true })
prop(Base, 'opacity', num, function() { this._needsPaint = true })

bboxProp(Base, 'left', function(left) {
  this.x = left - this.scale * this._costume.xOffset
})
bboxProp(Base, 'bottom', function(bottom) {
  this.y = bottom - this.scale * this._costume.yOffset
})
bboxProp(Base, 'right', function(right) {
  this.x = right - this.scale * (this._costume.width + this._costume.xOffset)
})
bboxProp(Base, 'top', function(top) {
  this.y = top - this.scale * (this._costume.height + this._costume.yOffset)
})

Base.prototype._computeBBox = function() {
  if (this.angle === 0) {
    const costume = this._costume
    const s = this.scale
    const x = this.x + costume.xOffset * s
    const y = this.y + costume.yOffset * s
    return {
      left: x,
      bottom: y,
      right: x + costume.width * s,
      top: y + costume.height * s,
    }
  } else {
    return this._rotatedBounds()
  }
}
lazyProp(Base, 'bbox', Base.prototype._computeBBox)

Base.prototype._rotatedBounds = function() {
  const costume = this._costume
  const s = this.scale
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

  return {
    left: this.x + Math.min(tlX, trX, blX, brX),
    right: this.x + Math.max(tlX, trX, blX, brX),
    top: this.y + Math.max(tlY, trY, blY, brY),
    bottom: this.y + Math.min(tlY, trY, blY, brY)
  }
}

Base.prototype.raise = function() {
  if (this.dead) return
  this.world._root.appendChild(this.el)
}

Base.prototype.destroy = function() {
  if (this.dead) return
  this.world._root.removeChild(this.el)
  this.dead = true
  var index = this.world.sprites.indexOf(this)
  if (index !== -1) {
    // assume destroy() is rare
    this.world.sprites.splice(index, 1)
  }
}

Base.prototype._paint = function() {
  this.el.style.opacity = this.opacity
  this._needsPaint = false
}

Base.prototype._transform = function() {
  const costume = this._costume
  const s = this.scale
  var transform = ''
  const x = this.x + costume.xOffset
  const y = this.world.height - this.y - costume.height - costume.yOffset
  transform += 'translate(' + x + 'px, ' + y + 'px) '
  if (this.angle !== 0) { transform += 'rotate(' + this.angle + 'deg) ' }
  if (this.scale !== 1) { transform += 'scale(' + s + ') ' }
  if (this.flipped) { transform += 'scaleX(-1) ' }
  this.el.style.transform = transform
  this.el.style.transformOrigin = -costume.xOffset + 'px ' + -costume.yOffset + 'px'
  this._needsTransform = false
}

Base.prototype.isTouchingEdge = function() {
  const b = this.bbox
  const w = this.world.width, h = this.world.height
  return b.left <= 0 || b.right >= w || b.bottom <= 0 || b.top >= h
}

Base.prototype.isOnScreen = function() {
  const b = this.bbox
  const w = this.world.width, h = this.world.height
  // TODO
  return true //!(b.right > 0 && b.left < w && b.bottom > 0 && b.top < h)
}

Base.prototype.touchesPoint = function(x, y) {
  var bounds = this.bbox
  if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
    return false
  }
  const costume = this._costume
  var cx = (x - this.x) / this.scale
  var cy = (this.y - y) / this.scale // TODO
  if (this.angle !== 0) {
    const d = -this.angle * Math.PI / 180 // (dir = angle + 90)
    const ox = cx
    const s = Math.sin(d), c = Math.cos(d)
    cx = c * ox - s * cy
    cy = s * ox + c * cy
  }
  if (this.flipped) {
    cx = -cx //this._costume.width - cx
  }
  const d = costume.context.getImageData(cx - costume.xOffset, cy - costume.yOffset, 1, 1).data
  return d[3] !== 0
}

Base.prototype._draw = function(ctx) {
  const costume = this._costume
  ctx.save()
  ctx.translate(this.x|0, -this.y|0) //(this.x * z | 0) / z, (-this.y * z | 0) / z)
  ctx.rotate(this.angle * Math.PI / 180)
  if (this.flipped) {
    ctx.scale(-1, 1)
  }
  ctx.scale(this.scale, this.scale)
  ctx.translate(costume.xOffset, costume.yOffset)
  ctx.drawImage(costume.canvas, 0, 0)
  ctx.restore()
}

Base.prototype.isTouchingFast = function(s) {
  if (!(s instanceof Base)) { throw new Error('not a sprite: ' + s) }
  if (s === this) return false
  if (s.opacity === 0) return false
  const mb = this.bbox
  const ob = s.bbox
  if (mb.left >= ob.right || mb.right <= ob.left || mb.top <= ob.bottom || mb.bottom >= ob.top) {
    return false
  }
  return true
}

Base.prototype.isTouching = function(s) {
  if (!this.isTouchingFast(s)) {
    return false
  }
  const mb = this.bbox
  const ob = s.bbox

  const left = Math.max(mb.left, ob.left)
  const top = Math.min(mb.top, ob.top)
  const right = Math.min(mb.right, ob.right)
  const bottom = Math.max(mb.bottom, ob.bottom)

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
  //world._wrap.appendChild(collisionCanvas)

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


/* Sprite */

const Sprite = function(props) {
  if (!props.costume) { throw new Error('Sprite needs costume') }
  Base.call(this, props, function(props) {
    this.costume = props.costume
  })
}
Sprite.prototype = Object.create(Base.prototype)

prop(Sprite, 'costume', Costume.get, function(costume) {
  this._setCostume(costume)
})


/* Text */

const Text = function(props) {
  var props = Object.assign({
    text: '',
    fill: '#000',
    scale: 4,
  }, props || {})
  if (props.text === undefined) { throw new Error('Text needs text') }
  Base.call(this, props, function(props) {
    this._fill = props.fill
    this.text = props.text // draw shape
  })
}
Text.prototype = Object.create(Base.prototype)

prop(Text, 'text', x => ''+x, function(text) {
  this._setCostume(this._costume = Costume._text({
    text: text,
    fill: this._fill,
  }))
})



/* Polygon */

const Polygon = function(props) {
  Base.call(this, props, function(props) {
    this._fill = props.fill
    this._outline = props.fill
    this._thickness = props.thickness
    this._closed = props.closed
    this.points = props.points // draw shape
  })
}
Polygon.prototype = Object.create(Base.prototype)


// TODO
/*
Polygon.rect = function(props) {
  var props = props || {}
  const w = props.width
  const h = props.height
  return Costume.polygon(Object.assign({
    //points: [{x: 0, y: 0}, {x: w, y: 0}, {x: w, y: h}, {x: 0, y: h}],
    points: [[0, 0], [w, 0], [w, h], [0, h]],
  }, props))
}
*/


// forever

function forever(cb) {
  const w = world
  w.on('frame', function listener() {
    if (cb() === false) {
      w.unlisten('frame', listener)
    }
  })
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
  degrees,
  radians,
  sin: a => Math.sin(radians(a)),
  cos: a => Math.cos(radians(a)),
  atan2: (x, y) => degrees(Math.atan2(x, -y)),
  dist: (dx, dy) => Math.sqrt(dx * dx + dy * dy),
}


module.exports = Object.assign({
  init,
  assets,
  Phone,
  World,
  Costume,
  Sprite,
  Text,
  Polygon,
  forever,
}, maths)


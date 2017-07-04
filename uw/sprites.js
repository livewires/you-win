(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./emitter'), require('./emojis'))
  } else {
    root.UW = factory(root.emitter, root.emojiList)
  }
}(this, function(emitter, emojiList) {

  let num = x => +x
  let round = x => (x + 0.5)|0
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
          changed.call(this, value)
        }
      },
      enumerable: true,
      configurable: true,
    })
  }

  function canvasToURL(canvas) {
    return new Promise((resolve, reject) => {
      if (canvas.toBlob) {
        canvas.toBlob(blob => {
          resolve(URL.createObjectURL(blob))
        })
      } else {
        resolve(canvas.toDataURL('image/png'))
      }
    })
  }


  /* init */

  var assets = Object.create(null)
  function init(promiseMap, cb) {
    if (typeof cb !== 'function') {
      throw new Error('usage: init({ ... }, () => { ... })')
    }

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
    Promise.all(promises).then(() => {
      cb()
    })
  }

  // TODO progress bar


  /* Phone */

  const Phone = function() {
    if (this === undefined) { throw new Error('requires `new` keyword') }
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

  Object.defineProperty(Phone.prototype, 'hasMotion', {
    get: function() {
      return this.motion !== null && this.motion.x != null && this.motion.y != null && this.motion.z != null
    },
    enumerable: true,
  })


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

    //const de = document.documentElement
    Object.assign(this, {
      background: '#fff',
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: 0,
      scrollY: 0,
    }, props)
    this.sprites = []

    window.addEventListener('resize', function() { this._needsResize = true })
  }
  emitter(World.prototype)

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
    this.emit('frame')

    if (this._needsResize) this._resize()

    const didScroll = this._needsScroll
    if (this._needsScroll) this._scroll()

    var sprites = this.sprites
    for (var i=sprites.length; i--; ) {
      const sprite = sprites[i]
      if (sprite._needsPaint) sprite._paint()
      if (sprite._needsTransform) sprite._transform()
      sprite._touching = null

      // don't render offscreen sprites
      const show = sprite.isOnScreen()
      if (sprite._show !== show) {
        sprite._show = show
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


  /* Costume */

  const Costume = function(img) {
    this.img = img
    this.width = img.naturalWidth
    this.height = img.naturalHeight
  }

  Costume.load = function(url) {
    const img = new Image
    img.crossOrigin = 'anonymous'
    img.src = url ///^http/.test(url) ? 'http://crossorigin.me/' + url : url
    return new Promise(resolve => {
      img.addEventListener('load', () => {
        resolve(new Costume(img))
      })
    })
  }

  Costume.get = function(name) {
    if (name.constructor === Costume) {
      return Costume
    } else {
      const costume = assets[name]
      if (!costume) {
        throw new Error('unknown costume: ' + name)
      }
      return costume
    }
  }

  Costume.emoji = function(emoji) {
    if (!emojiList) { throw new Error('emoji list not available') }
    const index = emojiList.indexOf(emoji)
    if (index === -1) { throw new Error('unknown emoji: ' + emoji) }
    return Costume.load('emoji.png').then(sheet => {
      return sheet.slice(index, {
        xSize: 32,
        ySize: 32,
        xMargin: 2,
        yMargin: 2,
        xCount: 30,
      })
    })
  }

  Costume.prototype.slice = function(index, props) {
    // (xSize + xMargin) * xCount = width
    // xSize = width / xCount - xMargin
    // (xSize + xMargin) * xCount = width
    var props = Object.assign({
      xSize: null,
      ySize: null,
      xCount: null,
      xMargin: 0,
      yMargin: 0,
    }, props)
    props.xSize = props.xSize || this.width / props.xCount - props.xMargin
    props.ySize = props.ySize || this.height / props.yCount - props.yMargin
    props.xCount = props.xCount || this.width / (props.xSize + props.xMargin)
    const result = {}
    const x = 1 + (props.xSize + props.xMargin) * (index % props.xCount)
    const y = (props.ySize + props.yMargin) * Math.floor(index / props.xCount)

    const canvas = document.createElement('canvas')
    canvas.width = props.xSize
    canvas.height = props.ySize
    const ctx = canvas.getContext('2d')
    ctx.drawImage(this.img, -x|0, -y|0)
    return canvasToURL(canvas).then(Costume.load)
  }


  /* Sprite */

  const collisionCanvas = document.createElement('canvas')
  const collisionContext = collisionCanvas.getContext('2d')
  collisionContext.imageSmoothingEnabled = false
  //collisionCanvas.style.border = '1px solid blue'

  const Sprite = function(costume, props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    if (!costume) { throw new Error('Sprite needs costume name') }
    if (!world) { throw new Error('make World first') }
    var props = props || {}

    this.el = document.createElement('img')
    this.el.style.position = 'absolute'
    this.el.style.imageRendering = 'pixelated'
    this.el.style.imageRendering = 'crisp-edges'
    this.el.style.imageRendering = '-moz-crisp-edges'

    this.costume = costume

    const s = props.scale || 1
    Object.assign(this, {
      x: (world.width / 2 - world.scrollX)|0,
      y: (world.height / 2 - world.scrollY)|0,
      xOffset: this.xOffset,
      yOffset: this.yOffset,
      scale: 1,
      opacity: 1,
      angle: 0,
      flipped: false,
    }, props)
    this.dead = false
    world.sprites.push(this)
    this.raise()
    this._touching = null
  }
  emitter(Sprite.prototype)

  prop(Sprite, 'x', round, function() { this._needsTransform = true; this._updateBBox() })
  prop(Sprite, 'y', round, function() { this._needsTransform = true; this._updateBBox() })
  prop(Sprite, 'xOffset', round, function() { this._needsTransform = true; this._updateBBox() })
  prop(Sprite, 'yOffset', round, function() { this._needsTransform = true; this._updateBBox() })
  prop(Sprite, 'scale', num, function() { this._needsTransform = true; this._updateBBox() })
  prop(Sprite, 'angle', num, function() { this._needsTransform = true; this._updateBBox() })
  prop(Sprite, 'flipped', bool, function() { this._needsTransform = true })
  prop(Sprite, 'opacity', num, function() { this._needsPaint = true })
  prop(Sprite, 'costume', Costume.get, function(costume) {
    this.el.src = costume.img.src
    this.xOffset = -costume.width / 2
    this.yOffset = -costume.height / 2
    this._width = costume.width
    this._height = costume.height
    this._updateBBox()
    return costume
  })

  Sprite.prototype._updateBBox = function() {
    if (this.angle === 0) {
      const s = this.scale
      const x = this.x + this.xOffset * s
      const y = this.y + this.yOffset * s
      this.bbox = {
        left: x,
        bottom: y,
        right: x + this._width * s,
        top: y + this._height * s,
      }
    } else {
      this.bbox = this.rotatedBounds()
    }
  }

  Sprite.prototype.raise = function() {
    if (this.dead) return
    world._root.appendChild(this.el)
  }

  Sprite.prototype.destroy = function() {
    if (this.dead) return
    world._root.removeChild(this.el)
    this.dead = true
    var index = world.sprites.indexOf(this)
    if (index !== -1) {
      // assume destroy() is rare
      world.sprites.splice(index, 1)
    }
  }

  Sprite.prototype._paint = function() {
    this.el.style.opacity = this.opacity
    this._needsPaint = false
  }

  Sprite.prototype._transform = function() {
    const s = this.scale
    var transform = ''
    const x = this.x + this.xOffset
    const y = world.height - this.y - this._height - this.yOffset
    transform += 'translate(' + x + 'px, ' + y + 'px) '
    if (this.angle !== 0) { transform += 'rotate(' + this.angle + 'deg) ' }
    if (this.scale !== 1) { transform += 'scale(' + s + ') ' }
    if (this.flipped) { transform += 'scaleX(-1) ' }
    this.el.style.transform = transform
    this.el.style.transformOrigin = -this.xOffset + 'px ' + -this.yOffset + 'px'
    this._needsTransform = false
  }

  Sprite.prototype.isTouchingEdge = function() {
    const b = this.bbox
    const w = world.width, h = world.height
    return b.left <= 0 || b.right >= w || b.bottom <= 0 || b.top >= h
  }

  Sprite.prototype.isOnScreen = function() {
    const b = this.bbox
    const w = world.width, h = world.height
    // TODO
    return true //!(b.right > 0 && b.left < w && b.bottom > 0 && b.top < h)
  }

  Sprite.prototype.rotatedBounds = function() {
    const costume = this.costume
    const s = this.scale
    const left = this.xOffset * s
    const top = -this.yOffset * s
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

  Sprite.prototype._draw = function(ctx) {
    const costume = this.costume
    ctx.save()
    ctx.translate(this.x|0, -this.y|0) //(this.x * z | 0) / z, (-this.y * z | 0) / z)
    ctx.rotate(this.angle * Math.PI / 180)
    if (this.flipped) {
      ctx.scale(-1, 1)
    }
    ctx.scale(this.scale, this.scale)
    ctx.translate(this.xOffset, this.yOffset)
    ctx.drawImage(costume.img, 0, 0)
    ctx.restore()
  }

  Sprite.prototype.isTouching = function(s) {
    if (s.constructor !== Sprite) { throw new Error('not a sprite: ' + s) }
    if (s === this) return false
    if (s.opacity === 0) return false
    const mb = this.bbox
    const ob = s.bbox
    if (mb.left >= ob.right || mb.right <= ob.left || mb.top <= ob.bottom || mb.bottom >= ob.top) {
      return false
    }

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

  Sprite.prototype.touching = function() {
    if (this._touching) return this._touching
    const sprites = world.sprites
    const bbox = this.bbox
    this._touching = []
    for (var i=sprites.length; i--; ) {
      const s = sprites[i]
      if (this.isTouching(s)) {
        this._touching.push(s)
      }
    }
    return this._touching
  }


  // forever

  function forever(cb) {
    world.on('frame', function listener() {
      if (cb() === false) {
        world.unlisten('frame', listener)
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


  return Object.assign({
    init,
    assets,
    Phone,
    World,
    Sprite,
    Costume,
    forever,
  }, maths)
}))

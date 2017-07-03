(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./emitter'), require('./emojis'))
  } else {
    root.UW = factory(root.emitter, root.emojiList)
  }
}(this, function(emitter, emojiList) {

  function prop(O, name, setter) {
    Object.defineProperty(O.prototype, name, {
      get: function() {
        return this['_' + name]
      },
      set: function(value) {
        this['_' + name] = setter.call(this, value)
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
            alert('not a phone')
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
      alert('not a phone')
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
    this._requestResize()
    this._requestScroll()

    //const de = document.documentElement
    Object.assign(this, {
      background: '#fff',
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: 0,
      scrollY: 0,
    }, props)
    this.sprites = []
    this._toPaint = []

    window.addEventListener('resize', e => this._requestResize())
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
    if (this._needsScroll) {
      this._scroll()
      var sprites = this.sprites
      for (var i=0; i<sprites.length; i++) {
        // TODO update visibility
      }
    }

    var sprites = this._toPaint
    for (var i=sprites.length; i--; ) {
      sprites[i].paint()
    }
    this._toPaint = []

    requestAnimationFrame(this.frame.bind(this))
  }
  World.prototype.start = World.prototype.frame

  World.prototype._requestResize = function(value) {
    this._needsResize = true
    return value
  }
  World.prototype._requestScroll = function(value) {
    this._needsScroll = true
    return value
  }
  prop(World, 'width', World.prototype._requestResize)
  prop(World, 'height', World.prototype._requestResize)
  prop(World, 'scrollX', World.prototype._requestScroll)
  prop(World, 'scrollY', World.prototype._requestScroll)
  prop(World, 'background', function(color) {
    this._wrap.style.background = color
    return color
  })


  /* Costume */

  const Costume = function(img) {
    this.img = img
    this.width = img.naturalWidth
    this.height = img.naturalHeight
  }

  Costume.load = function(url) {
    const img = new Image
    img.src = url
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

  const Sprite = function(costume, props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    if (!costume) { throw new Error('Sprite needs costume name') }
    if (!world) { throw new Error('make World first') }

    this.el = document.createElement('img')
    this.el.style.position = 'absolute'
    this.el.style.imageRendering = 'pixelated'
    this.el.style.imageRendering = 'crisp-edges'
    this.costume = costume

    Object.assign(this, {
      x: (world.width / 2)|0,
      y: (world.height / 2)|0,
      xOffset: this.xOffset,
      yOffset: this.yOffset,
      scale: 1,
      opacity: 1,
      angle: 0,
      flipped: false,
    }, props)
    this.dead = false
    this.raise()
  }
  emitter(Sprite.prototype)

  const requestPaint = Sprite.prototype._requestPaint = function(value) {
    if (!this._needsPaint) {
      if (this.dead) { return }
      this._needsPaint = true
      world._toPaint.push(this)
    }
    return value
  }

  prop(Sprite, 'x', requestPaint)
  prop(Sprite, 'y', requestPaint)
  prop(Sprite, 'scale', requestPaint)
  prop(Sprite, 'opacity', requestPaint)
  prop(Sprite, 'angle', requestPaint)
  prop(Sprite, 'flipped', requestPaint)
  prop(Sprite, 'costume', function (costume) {
    var costume = Costume.get(costume)
    this.el.src = costume.img.src
    this.xOffset = -costume.width / 2
    this.yOffset = -costume.height / 2
    this._height = costume.height
    return costume
  })

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

  Sprite.prototype.paint = function() {
    this.el.style.opacity = this.opacity
    const s = this.scale
    var transform = ''
    const x = this.x + this.xOffset
    const y = world.height - this.y - this._height - this.yOffset/s
    transform += 'translate(' + x + 'px, ' + y + 'px) '
    if (this.angle !== 0) { transform += 'rotate(' + this.angle + 'deg) ' }
    if (this.scale !== 1) { transform += 'scale(' + s + ') ' }
    if (this.flipped) { transform += 'scaleX(-1) ' }
    this.el.style.transform = transform
    this.el.style.transformOrigin = -this.xOffset + 'px ' + -this.yOffset + 'px'
    this._needsPaint = false
  }

  // forever

  function forever(cb) {
    world.on('frame', cb)
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

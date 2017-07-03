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


  /* World */

  var World = function(props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    world = this
    if (!props.width || !props.height) {
      throw new Error('needs size: try `new World({width: phone.width, height: phone.height})`')
    }
    Object.assign(this, props)
    this._requestPaint()
    this.sprites = []
    this._toPaint = []
    this.wrap = document.createElement('div')
    this.wrap.appendChild(this.el = document.createElement('div'))
    document.body.appendChild(this.wrap)
  }
  emitter(World.prototype)

  World.prototype._requestPaint = function(value) {
    this._needsPaint = true
    return value
  }

  World.prototype.frame = function() {
    this.emit('frame')

    if (this._needsPaint) {
      // TODO resize
    }

    var sprites = this._toPaint
    for (var i=sprites.length; i--; ) {
      sprites[i].paint()
    }
    this._toPaint = []

    requestAnimationFrame(this.frame.bind(this))
  }
  World.prototype.start = World.prototype.frame

  // TODO ??
  prop(World, 'width', World.prototype._requestPaint)
  prop(World, 'height', World.prototype._requestPaint)


  /* Costume */

  const Costume = function(img) {
    this.img = img
    this.width = img.naturalWidth
    this.height = img.naturalHeight
  }

  Costume.load = function(url) {
    return new Promise((resolve, reject) => {
      var img = document.createElement('img')
      img.src = url
      img.addEventListener('load', function(e) {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        resolve(new Costume(canvas))
      })
      // TODO emit errors
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
    ctx.drawImage(this.img, -x, -y)

    return canvasToURL(canvas).then(url => {
      const img = new Image
      img.src = url
      return new Costume(img)
    })
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
      x: world.width / 2 || 0,
      y: world.height / 2 || 0,
      xOffset: costume.width / 2,
      yOffset: costume.height / 2,
      scale: 1,
      opacity: 1,
      angle: 0,
      flipped: false,
    }, props)
    world.el.appendChild(this.el)
  }
  emitter(Sprite.prototype)

  const requestPaint = Sprite.prototype._requestPaint = function(value) {
    if (!this._needsPaint) {
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
    return costume
  })

  Sprite.prototype.destroy = function() {
    world.removeChild(this.el)
    // var index = world.sprites.indexOf(this)
    // if (index !== -1) {
    //   // assume destroy() is rare
    //   world.sprites.splice(index, 1)
    // }
  }

  Sprite.prototype.paint = function() {
    this.el.style.opacity = this.opacity
    var transform = ''
    transform += 'translate(' + this.x + 'px, ' + this.y + 'px) '
    if (this.angle !== 0) { transform += 'rotate(' + this.angle + 'deg) ' }
    if (this.scale !== 1) { transform += 'scale(' + this.scale + ') ' }
    if (this.flipped) { transform += 'scaleX(-1) ' }
    this.el.style.transform = transform
    this.el.style.transformOrigin = -this.xOffset + 'px ' + -this.yOffset + 'px';
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
  };
  for (var i=0; i<=10; i++) { keyCodes[''+i] = i + 48; }
  for (var i=1; i<=12; i++) { keyCodes['F'+i] = i + 111; }
  for (var i=65; i<=90; i++) { keyCodes[String.fromCharCode(i + 32)] = i; }


  return {
    init,
    assets,
    World,
    Sprite,
    Costume,
    forever,
  }
}))

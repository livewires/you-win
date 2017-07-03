(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.U = factory();
    }
}(this, function() {
  var U = {}

  function prop(O, name) {
    Object.defineProperty(O.prototype, name, {
      get: function() {
        return this['_' + name]
      },
      set: function(value) {
        this['_' + name] = value
        this._requestPaint()
      },
      enumerable: true,
      configurable: true,
    })
  }


  /* Phone */

  U.phone = new function() {
  }


  /* World */

  var world
  U.init = function(props, cb) {
    if (typeof cb !== 'function') {
      throw new Error('usage: init({ ... }, () => { ... })')
    }
    // world.on('ready', cb)
    world = new World(props)
    world.onReady = function() {
      cb(world)
      world.frame()
    }
  }

  var World = function(props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    if (!props.width || !props.height) {
      throw new Error('needs size: try `new World({width: phone.width, height: phone.height})`')
    }
    Object.assign(this, props)
    this._requestPaint()
    this.sprites = []
    this._toPaint = []
    this._loops = []
    this.wrap = document.createElement('div')
    this.wrap.appendChild(this.el = document.createElement('div'))

    document.body.appendChild(this.wrap)

    // TODO progress bar
    var loading = 0
    var _this = this
    this._assets = {}
    Object.keys(this.images).forEach(function(name) {
      var img = _this._assets[name] = document.createElement('img')
      img.src = _this.images[name]
      loading++
      img.addEventListener('load', function(e) {
        loading--
        if (loading === 0) {
          _this.onReady()
        }
      })
    })
  }

  World.prototype._requestPaint = function() {
    this._needsPaint = true
  }

  World.prototype._doLoops = function() {
    var loops = this._loops
    for (var i=0; i<loops.length; i++) {
      loops[i]()
    }
  }

  World.prototype.frame = function() {
    this._doLoops()

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

  // TODO ??
  prop(World, 'width')
  prop(World, 'height')


  /* Sprite */

  U.Sprite = function(props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    this._requestPaint()
    Object.assign(this, {
      x: world.width / 2,
      y: world.height / 2,
      scale: 1,
      opacity: 1,
      angle: 0,
      flipped: false,
    }, props)
    //world.sprites.push(this)
    this.el = this._render()
    world.el.appendChild(this.el)
  }

  prop(U.Sprite, 'x')
  prop(U.Sprite, 'y')
  prop(U.Sprite, 'scale')
  prop(U.Sprite, 'opacity')
  prop(U.Sprite, 'angle')
  prop(U.Sprite, 'flipped')

  U.Sprite.prototype._render = function() {
    if (!this.image) {
      throw new Error("try: new Sprite({ image: ... })")
    }
    return world._assets[this.image]
  }

  U.Sprite.prototype.destroy = function() {
    world.removeChild(this.el)
    // var index = world.sprites.indexOf(this)
    // if (index !== -1) {
    //   // assume destroy() is rare
    //   world.sprites.splice(index, 1)
    // }
  }

  U.Sprite.prototype._requestPaint = function() {
    if (this._needsPaint) return
    this._needsPaint = true
    world._toPaint.push(this)
  }

  U.Sprite.prototype.paint = function() {
    this.el.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px)'
    this._needsPaint = false
  }

  // forever

  U.forever = function(cb) {
    world._loops.push(cb)
  }

  return U
}))

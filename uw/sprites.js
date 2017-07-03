(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./emitter'))
    } else {
        root.UW = factory(root.emitter)
    }
}(this, function(emitter) {

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


  /* init */

  var assets = Object.create(null)
  var world
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
    this._loops = []
    this.wrap = document.createElement('div')
    this.wrap.appendChild(this.el = document.createElement('div'))
    document.body.appendChild(this.wrap)
  }
  emitter(World.prototype)

  World.prototype._requestPaint = function(value) {
    this._needsPaint = true
    return value
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
  World.prototype.start = World.prototype.frame

  // TODO ??
  prop(World, 'width', World.prototype._requestPaint)
  prop(World, 'height', World.prototype._requestPaint)


  /* Costume */

  const Costume = function(image) {
    this.el = image
    this.width = image.naturalWidth
    this.height = image.naturalHeight
  }

  Costume.load = function(url) {
    return new Promise((resolve, reject) => {
      var img = document.createElement('img')
      img.src = url
      img.addEventListener('load', function(e) {
        resolve(new Costume(img))
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

  Costume.prototype.slice = function(names, props) {
    // (xSize + xMargin) * xCount = width
    // xSize = width / xCount - xMargin
    // (xSize + xMargin) * xCount = width
    var props = Object.assign({
      xSize: null,
      ySize: null,
      xCount: null,
      yCount: null,
      xMargin: 0,
      yMargin: 0,
    }, props)
    props.xSize = props.xSize || this.width / props.xCount - props.xMargin
    props.ySize = props.ySize || this.height / props.yCount - props.yMargin
    props.xCount = props.xCount || this.width / (props.xSize + props.xMargin)
    props.yCount = props.yCount || this.height / (props.ySize + props.yMargin)
    const result = {}
    for (var i=0; i<names.length; i++) {
      const name = names[i]
      // TODO 
      result[name] = null
    }
    return result
  }


  /* Sprite */

  const Sprite = function(costume, props) {
    if (this === undefined) { throw new Error('requires `new` keyword') }
    if (!costume) { throw new Error('Sprite needs costume name') }
    if (!world) { throw new Error('make World first') }
    this.costume = costume
    Object.assign(this, {
      x: world.width / 2 || 0,
      y: world.height / 2 || 0,
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
    if (this.el) { this.el.src = costume.el }
    else { this.el = costume.el }
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
    this.el.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px)'
    this._needsPaint = false
  }

  // forever

  function forever(cb) {
    world._loops.push(cb)
  }


  return {
    init,
    assets,
    World,
    Sprite,
    forever,
  }
}))

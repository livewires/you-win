/*
 * adapted from https://github.com/nathan/v2/blob/master/emitter.js
 */
/*
Copyright 2017 Nathan
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

function on(e, fn) {
    const m = this._listeners || (this._listeners = new Map)
    const l = m.get(e)
    if (l) !l.includes(fn) && l.push(fn)
    else m.set(e, [fn])
    return this
}
function once(e, fn) {
    const bound = x => {
        fn(x)
        this.unlisten(e, bound)
    }
    this.on(e, bound)
    return this
}
function unlisten(e, fn) {
    const m = this._listeners
    if (!m) return this
    const l = m.get(e)
    if (!l) return this
    const i = l.indexOf(fn)
    if (i !== -1) l.splice(i, 1)
    return this
}
function listeners(e) {
    const m = this._listeners
    return m ? m.get(e) || [] : []
}
function emit(e, arg) {
    const m = this._listeners
    if (!m) return
    const l = m.get(e)
    if (!l) return
    var result
    for (let i = l.length; i--;) {
        const v = l[i](arg)
        if (v !== undefined) result = v
    }
    return result
}

const PROPERTIES = {
    on: {value: on},
    once: {value: once},
    unlisten: {value: unlisten},
    listeners: {value: listeners},
    emit: {value: emit},
}

module.exports = function emitter(o, names) {
  const props = Object.assign({}, PROPERTIES)
  for (let name of names) {
    const capital = name[0].toUpperCase() + name.substr(1)
    props['on' + capital] = {
      value: function(fn) { return this.on(name, fn) },
    }
    props['onNext' + capital] = {
      value: function(fn) { return this.once(name, fn) }
    }
    props['emit' + capital] = {
      value: function(arg) { return this.emit(name, arg) }
    }
  }
  Object.defineProperties(o, props)
}


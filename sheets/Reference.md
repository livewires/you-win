
# you-win: API Reference


## Importing

`you-win` exports the following names:

* [init](#assets)
* [Costume](#costume)
* [World](#world)
* [Sprite](#sprite)
* [Phone](#phone)

To import all these names so you can use them in your code, use the following line:

```js
var {init, Phone, World, Sprite, Costume, forever} = UW
```


## Assets

Before you can do anything, you need initialise `you-win`. You do this by calling `UW.load`.

```js
UW.load({
    // the images you need
})
.then(() => {
    // make your world and start your game
})
```

  * **`UW.load(images)`**

    Pulls in the media files you need for your game. The code **after `then`** will run once they're all ready.
    
    Displays a progress bar while the media files are downloading.


### Costume

A **`Costume`** is an image that controls how a `Sprite` looks.

You must create costumes inside `UW.load`, using either `Costume.load` or `Costume.emoji`.

```js
UW.load({
    asteroid: Costume.load('/asteroid.jpg'),
    poop: Costume.emoji('💩'),
})
```

  * **`Costume.load(url)`**

    Get a costume from a URL (web address).
    
    > ⚠ Because of security restrictions, you can't use just any image URL from any website. Assets stored in your [Glitch](https://glitch.com) project will work fine; copy their URL here.

    If you make a `static` folder in the same place as your game's `.js` file, you can put images inside it, and then load them here using the URL `'/my-image.jpg'`.

  * **`Costume.emoji(emoji)`**
    
    Return a costume based on the given emoji, sized 32x32 pixels. Not all the emoji are included. Emoji make great placeholder graphics for your game, or even final graphics if you like the retro pixel-art theme.

If you just pass a string, it will be treated as if you called `Costume.load`.

```js
UW.load({
    // get asteroid.jpg from my `static` folder
    asteroid: '/asteroid.jpg',
    face: 'https://cdn.glitch.com/f213ed6a-d103-4816-b60d-47c712a926e2%2Fcat_00.png',
})
```

## World

**`World`** sets up the screen, manages all the sprites, and emits events such as taps and drags on the background.

Set up the world after [loading your assets](#assets).

```js
UW.load({
    // ...
})
.then(() => {
    
    var world = new World({
        width: 480,
        height: 360,
    })

    // make sprites...

    world.start()

})
```

It has the following attributes:

  * **`world.width` / `world.height`**

    The size of the game's visible area on the screen.

    If you don't provide a width or height when making your world, it will default to using the size of the phone's screen.

  * **`world.scrollX` / `world.scrollY`**

    An offset applied to all of the objects on-screen.

    You can change these in order to move around the virtual "camera" to show different parts of the world, e.g. for writing a platformer. But be aware, the `x` and `y` positions of your sprites won't change when you scroll; so a sprite at `x: 0, y: 0` may no longer be in the bottom-left corner of the screen!

  * **`world.background`**

    The background colour of the world. Uses HTML/CSS colours, such as `red` or `#007de0`.


Your World has an important method:

  * **`world.start()`**

    This shows the world on the screen and starts all your `forever` loops running.

    Call this once you've set up your game.

    **TODO**: remove this. The World constructor can do this itself!


### forever

`forever` is really useful function: it lets you do something on every "frame" or "tick" of your game. Usually ticks happen 60 times a second (60 FPS).

Write a forever loop with a function just inside it, like so:

```js
forever(() => {
    // do stuff
})
```

Any code after the forever loop isn't affected:

```js
forever(() => {
    // do stuff
})

forever(() => {
    // do other stuff
})

// carry on setting up the game ...
```

If you want to **stop** a `forever` loop (so that it doesn't run forever!), you can `return false`:

```js
forever(() => {
    if (player.isTouching(floor)) { // the floor is lava
        // game over!
        return false // stop this loop
    }
    // otherwise, move the player...
})
```


## Sprite

A **`Sprite`** is an image in the world that can be moved and rotated and so on.

To create a Sprite, you must give the name of one of your `Costumes`. You may also include a list of attributes. 

```js
UW.load({
    poop: Costume.emoji('💩'),
})
.then(() => {

    var poop = new Sprite('poop')

    var bigPoop = new Sprite('poop', {
        scale: 2, // twice as big
    })

})
```

Sprites have quite a few attributes which you can change. You can also set their initial values when you make the sprite.

  * **`sprite.x`** / **`sprite.y`**

    The co-ordinates of the center of the sprite, starting from the bottom-left corner of the World.

  * **`sprite.angle = 0`**

    The rotation of the sprite, going clockwise.

    <img src="figs/sprite-xy.png" width=240>
    <img src="figs/sprite-angle.png" width=180>

  * **`sprite.scale = 1.0`**

    The scale factor of the sprite. `1.0` means 100%; `2.0` is twice the size; `0.5` is half the size.

  * **`sprite.flipped = false`**

    Either `true` or `false`.
    
    Whether to flip the sprite's costume, so that it faces the other way. Defaults to `false.

  * **`sprite.opacity = 1.0`**

    Controls the sprite's opacity aka. alpha aka. transparency aka. "ghost" effect.

    A value of `1.0` means the sprite is fully **opaque**; `0.0` means the sprite is fully see-through.

    If you want to remove the sprite entirely and forever, use `destroy()`.

  * **`sprite.costume = 'poop'`**

    The image to use for the sprite, in case you want to change it later. For example, if you want to cycle between several images in order to "animate" the sprite".

  * **`sprite.left`** / **`sprite.right`** / **`sprite.top`** / **`sprite.bottom`**

    **TODO**: implement getters/setters for these.

    The co-ordinates of the edges of the _bounding box_ of the sprite. The bounding box is an _axis-aligned_ box enclosing the whole sprite.

    **TODO**: diagram

    These can be useful for getting or changing the position of the edge of a sprite. They tend to be more useful for non-rotated sprites.

  * **`sprite.xOffset`** / **`sprite.yOffset`**

    The offset between the sprite's position, and the bottom-left corner of the sprite. The default is minus half the width and height of the costume, respectively, so that the sprite's costume is centered on the sprite's position.
    
    Usually you don't need to change this.


Sprites have some useful functions attached to them.

  * **`sprite.raise()`**

    Bring the sprite to the front, so that it is above all the other sprites.

  * **`sprite.lower()`**

    Send the sprite to the back, below all the other sprites. **TODO**
  
  * **`sprite.getTouching()`**

    Returns a list of sprites which are overlapping this one.

    Useful for detecting collisions!

    ```js
    for (var other in player.getTouching()) {
        if (other.isBullet) {
            // lose some health
        }
    }
    ```

  * **`sprite.isTouching(otherSprite)`**

    Returns `true` if the two sprites are overlapping; `false` otherwise.

  * **`sprite.touchesPoint(x, y)`**

    Returns `true` if the point overlaps the sprite; `false` otherwise.

    You probably won't need this, but it can be useful if you're doing complicated things involving `drag` events.

  * **`sprite.isTouchingEdge()`**

    Returns `true` if the sprite is near to the edge; `false` otherwise.

  * **`sprite.isOnScreen()`**

    Returns `false` if the sprite is completely off the screen; `true` otherwise.

    This takes into account scrolling.

  * **`sprite.destroy()`**

    Remove the sprite from the screen. Afterwards, the sprite is "dead" and you can't use it anymore.

    If you just want to hide the sprite for a moment, set its `opacity` to zero.


## Text

**TODO**

  * **`sprite.text`**

    The text to display. Note that the Text's `x` / `y` position is measured to its bottom-left corner.

  * **`sprite.fill`**

    The color of the text, e.g. `text.fill = '#007de0'`


## Polygon

**TODO** refactor Costume.polygon -> Polygon 'class'

```js
new Polygon({
    points: [[0, 0], [0, 32], [32, 32], [32, 0]],
    fill: '#007de0',
    outline: 'black',
    thickness: 2,
})
```

A Polygon has all the same attributes as a [Sprite](#sprite)--but instead of a `costume`, it has the following:

  * **`sprite.points`**

    A list of points. Each point is a 2-element list, like so:

  * **`sprite.fill`**

    The color of the text, e.g. `text.fill = '#007de0'`.

    Leave out this setting, or set it to `null`, for no fill (just an outline).

  * **`sprite.outline`**

    The outline color, e.g. `shape.outline = 'black'`.
    
    Leave out this setting, or set it to `null`, for no outline. You must specify _either_ a fill or an outline (or both).

  * **`sprite.thickness`**

    How thick to draw the outline (in pixels). Defaults to 2.

  * **`sprite.closed`**

    Whether the last point should be joined to the first one, to make a closed shape.
    
    Defaults to `true` for filled polygons.


## Events

An **event** tells you that something has happened. Both Worlds and Sprites will emit events when they are tapped or dragged.

If a tap overlaps more than one sprite (because the sprites are overlapping), then the sprites are told about the events in order. The front-most one sees the event first.

If a sprite wants to handle an event, it should `return false`. From then on, no other sprites (nor the `world`!) will see the event.

There are two types of event:

  * **`world.on('tap', e => { ... })`** / * **`sprite.on('tap', e => { ... })`**

    A `tap` event happens when a finger is pressed against the screen and let go without moving.

    The event object `e` has the following attributes:

      * **`e.fingerX`** / **`e.fingerY`**: the coordinates of the tap.

  * **`world.on('drag', e => { ... })`** / * **`sprite.on('drag', e => { ... })`**

    A `tap` event happens when a finger is pressed against the screen and let go without moving.

    The event object `e` has the following attributes:

      * **`e.startX`** / **`e.startY`**: the coordinate the drag started from.
      * **`e.deltaX`** / **`e.deltaY`**: the amount the finger has moved since the last drag event.
      * **`e.fingerX`** / **`e.fingerY`**: the current coordinates of the drag.


If you're testing your game on a computer, mouse clicks and drags will work to simulate touches -- but unlike fingers, a mouse pointer can only be in one place at a time!


### Detecting taps 

```js
world.on('tap', e => {
    // make a ball where you clicked
    var ball = new Sprite('beachball', {
        x: e.fingerX,
        y: e.fingerY,
    })

    ball.on('tap', e => {
        // flip
        ball.flipped = !ball.flipped

        // handle the event
        // - otherwise another ball will get spawned!
        return false
    })
})
```


### Dragging sprites around

```js
var ball = new Sprite('beachball')
ball.on('drag', e => {
    // move when dragged
    ball.x += e.deltaX
    ball.y += e.deltaY
    return false
})
```


## Detecting fingers held down

  * **`world.getFingers()`**

    **TODO**: document


## Phone

`Phone` provides access to sensors on a smartphone, such as the accelerometer. You can use this to control your game depending on how the phone is held; for example tilting to steer in a racing game. 

You need to make a `Phone` object before you can access the readings:

```js
var phone = new Phone()
```

It has the following attributes which you can get:

  * **``phone.zAngle``**: the angle of the phone's screen in relation to the ground.

    An angle of `0` means the phone is held upright. Tilt the phone to see it change.


## Sound

**TODO**


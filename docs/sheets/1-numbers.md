---
title: "#1: Numbers"
---

# Intro #1: Numbers

## Getting Started

You should have `you-win` running, with:

* a text editor, with a new game file open (e.g. a file called `game.js`).
* a Chrome window open (probably on `http://localhost:8000/`)
* (optional) a phone running Chrome or Safari, with your computer opened.

Put your text editor and Chrome window side-by-side, if you can (and/or keep your phone open in front of you!). Whenever save in your text editor, `you-win` will automatically refresh the page.

Make sure you have line numbers turned on in your text editor.

Your Chrome window should have a white screen. This is a blank canvas in which we can start making mobile games!

Have a look at the template that's open in your text editor. It should look like this:

```js
import * as UW from 'you-win'
import {forever, Phone, World, Sprite, Text, Polygon, Rect, Sound} from 'you-win'

// var phone = new Phone

UW.init({
})
.then(() => {

    var world = new World
    world.title = ''
    world.background = 'white'

    // ...

})
```

Look closely at these parts:

 1. `// var phone = new Phone`

    This is a comment! Lines starting with `//` are ignored by JavaScript.

    You can use comments to write messages for yourself, to remind yourself what different bits of your code do.

 2. `UW.init`.

    This is where we can load in any extra sounds or images for our game.

 3. `new World`

    This is where we make the `World`. The world represents the screen. We can set its `width` and `height` to change the size of the screen. (It's like the _Stage_ in Scratch.)


Let's do that now!

  * Set the `width` and `height` of the world.

    <s>
    ```js
    // ...
    ```
    </s>

    ```js
    world.width = 300
    world.height = 460
    ```
    _Add this where the comment with three dots '...' is._

    To change the attributes of an object in JavaScript, we write the name of the object, followed by a dot, and then `=`, and then the new value.

Save, and your world should change shape. It's now a white box, roughly the shape of a mobile phone in portrait, with black bars around the edges.



## Sprites

First, we need to know how to add things to the world, so they appear on the screen.

In JavaScript, you create new things using the `new` keyword, followed by the kind of thing you want to make (such as `World`, `Sprite`, or `Text`).

We can add images to the World by creating `Sprites`. A Sprite is an image on the screen, which we can move about, rotate, flip, scale, make transparent, and so on. Let’s make our first sprite.

  * Add this code, after the block which makes the World.

    ```js
    var poop = new Sprite
    poop.costume = '💩'
    ```

Save. Have a look at Chrome—now there should be a tiny poop in the middle of the screen!

We use the `var` keyword so we have a name to refer to our Sprite with.

As before, we can set object attributes using "dot notation", and giving it the new value.

Here are some kinds of values: _(These are just examples, don't type them in!)_

  * **Boolean**: either `true` or `false`.

    ```js
    foo.flipped = true // face the other way
    ```

  * **Number**: e.g. `123` or `3.14`.

  * **String**: some text, written in quotes: either single `'` or double `"`.

    ```js
    poop.costume = '⛄'
    foo.text = 'birb'
    foo.text = "potato"
    ```

Now try this.

  * **Challenge**: Set the `scale` property of your sprite (which is a number, starting at `1.0`).

When we make a sprite, we get to specify its initial values. We can change any of them later, too (more on that in the next chapter).

Here are some other properties you can try:

  * `opacity` (a number between 0 and 1, starting at `1.0`)
  * `angle` (a number, in degrees, starting at `0`)
  * `flipped` (a boolean, initially `false`)


## Coordinates

Let's move our sprite about. We can do this using the attributes `poop.posX` and `poop.posY`.

These are the co-ordinates of the center of the sprite, starting from the bottom-left corner of the screen.

Here's a quick diagram introducing coordinates:

<img src="static/sprite-xy.png" width=240>
<img src="static/sprite-angle.png" width=180>

  * Move your poop to the position `(100, 100)`.

    ```js
    poop.posX = 100
    poop.posY = 100
    ```

We can add other Sprites, too!

  * Add a second sprite, called `cow`.

    ```js
    var cow = new Sprite
    cow.costume = '🐄'
    ```


## Edges

So we use `.posX` and `.posY` to set the **center** of the sprite.

As well as those, we can use `.top`, `.bottom`, `.left`, and `.right`--which are the co-ordinates of the **edges** of the sprite.
 
  * Move the cow to touch the left side of the screen.

    ```js
    cow.left = 0
    ```

  * Move the poop to be to the right of the cow.

    <s>
    ```js
    poop.posY = 100
    ```
    </s>
    _Delete this line._

    ```js
    poop.left = cow.right
    ```
    _Add this line. Make sure it's after **both** of the `poop` and `cow` variables have been created._

This moves the poop so that his left edge is the same as the right edge of the cow.


## Randomness

Let's introduce some uncertainty into our creation.

We can use `UW.randomInt(1, 10)` to pick a random number between `1` and `10`. (This is just like `pick random _ to _` from Scratch.)

  * Move your poop to a random `posX` position.

    ```js
    poop.posX = UW.randomInt(0, world.width)
    ```

  * **Challenge:** Move your poop to a random `posY` position.

Refresh the page; every time you refresh, the position of the poop should change!

Now try copy/pasting the code for the poop, to make a couple more random ones.

  * Make two more poops.


## Text

We've seen how to do images; now let's add some text to the screen.

When you're a beginner programmer, it's traditional to introduce yourself by saying "Hello world!", so let's do that.

  * Create a `Text` object.
  
    ```js
    var label = new Text
    label.text = "Hello world!"
    ```

  * Change its color.

    ```js
    label.fill = 'red'
    label.fill = '#007de0' // whatever you fancy really
    ```


## The End

Good job! Now you know how to:

  * Make JavaScript objects with the **`new` keyword**
  * Use **`var` to name them**, so you can refer to them later
  * **Set their attributes**, using dot notation and `=`
  * Use `Sprite`s and `Text`
  * Set the **position** of objects inside the world
  * How to **pick random numbers** using `UW.randomInt`

Let's continue on to [chapter two](2-Animation)!


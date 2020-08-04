---
title: "00: New World"
---

# New World

## What you need

You should have `you-win` running in Glitch, with:

* a new game file open (e.g. a file called `app.js`).
* (optional) a phone running Chrome or Safari, with your glitch project opened.

See the [install page](install) for details about getting going. If you're not using glitch, it's helpful to turn on line numbers and, if possible, syntax highlighting in your text editor. 

Your project window should have a white screen. This is a blank canvas in which we can start making a game!

## The template

Have a look at the template that's open in your text editor. It should have the folllowing parts:

  * These lines load  `you-win`, the library we're using to help make our game.

    ```js
    import * as UW from 'you-win'
    import {forever, Phone, World, Sprite, Text, Polygon, Rect, Sound} from 'you-win'
    ```

  * We then load in all the sounds and images we need. By default this will load some emoji we can use to make sprites.

    ```js
    UW.init({

    })
    .then(() => {

    ```

  * We then make our `World`, which represents the screen.

    ```js
    // Make the world
    var world = new World
    world.title = ''
    world.background = 'white'

    // Now we can start making Sprites!
    ```


## Change the background colour

Let's change the background colour, to check everything is set up correctly. Find the line that sets the `background` property of the `world`, and change it to your favourite colour.

```js
world.background = '...'
```

You can use any of the colour names which are supported by HTML. If you give a colour name that it doesn't recognise, you'll proabably just get black. 

If you want other colours, instead of named colours you can use colours like `'#007de0'`. There are called a "hex code", short for hexadecimal. You can choose your own hex code colour with an online [colour picker](https://www.google.co.uk/search?q=colour+picker).

```js
world.background = '#007de0' // whatever you fancy really
```

👉 Save, and check that the page refreshes automatically. Check that the background colour changes!


## Set the shape of the screen

We can set the `width` and `height` of the world to change the size of the screen. (It's like the _Stage_ in Scratch.) Otherwise, the size and shape of our game's world will change depending on the size of your screen, so it'll play very differently on a phone, tablet, or laptop.

**Add this at the bottom of your program.**
```js
world.width = 300
world.height = 460
```

👉 Save, and your world should change shape. It should be roughly the shape of a phone in portrait, with black bars around the edges.

> ⚠️ All of this should go *before* the final two close braces in the program


---

➡️ Now, let's [add a Sprite](01-creating-sprites) to our world...

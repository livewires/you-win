# Intro #1: Numbers

numbers, coordinates, randomInt, Text

- variables
- numbers
- assignment
- project template [TODO. also, dirname static]
- objects
- UW coordinates, edges
- UW.randomInt() for positions
- text 

## JavaScript: Getting Started

* comments: the computer will ignore these, so you can write notes to yourself. eg TODOs.
* console vs editor ? or just introduce live reloading?
* console: defining numbers, add/mul/div

## Our First Project

Assuming you have `you-win` installed.

Open a terminal (**Command Prompt** on Windows, **Terminal** on macOS/Linux).

  * Use the `cd` command to move into the directory of your choice.
  * Start a new project, by typing:

    ```
    you-win first.js
    ```

This will create a new game from the `you-win` template, which should save you a bit of typing.

Open the `first.js` file you just created in your favourite text editor: for example **Gedit** (Ubuntu only), **VSCode**, **Brackets**, or **Sublime Text**. The template should look like this:

**TODO** (insert template.js)

Look closely at two parts:

  * **TODO**: `UW.init`
  * **TODO**: `new World`

Back in your Terminal, you should see a web address output to the console, eg `http://192.168.1.10:8000/`. Open that address in a web browser, preferably **Chromium** or **Google Chrome**. (You can also open the same link on your phone.)

You should see a white screen. This is a blank canvas in which we can start making mobile games!


## Sprites

First, we need to know how to add things to the world, so they appear on the screen. We do this by creating `Sprites`. A Sprite is an image on the screen, which we can move about, rotate, flip, scale, make transparent, and so on.

Let’s make our first sprite.

  * Add this code, after the block which makes the World.
  
    ```js
    var poop = new Sprite({
      costume: ‘💩’,
    })
    ```
  
Save. Have a look at Chrome—now there should be a tiny poop in the middle of the screen!

Put your text editor and Chrome window side-by-side, if you can (and/or keep your phone open in front of you!). Whenever save in your text editor, ``

* pull in a sprite.
* set its scale. When we make a sprite, we get to specify its initial values. We can change any of them later, too.

## Coordinates

* intro to coordinates
* edge attributes
* world.width / height.

## Randomness

* UW.randomInt()
* challenge: make two more random ones 

## Text

* display "Hello!"
* challenge: display the result of 20 * 30

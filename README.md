
Mobile games for beginners.

## Docs ##

Setup:

  * [Install](#installing)
  * [Getting Started](#getting-started)

Tutorial-style guide for beginners to JS:

  * [Intro #1: **Numbers**](sheets/1-Numbers.md)
  * [Intro #2: **Animation**](sheets/2-Animation.md)
  * Intro #3: Functions **TODO**
  * Intro #4: Arrays **TODO**
  * [Game: **Jump**](sheets/Jump.md) (a _Doodle Jump_ clone)

Library documentation:

  * [API Reference](sheets/Reference.md).


### Why "you-win"? ###

Because `game-over` was taken.


## Installing ##

 1. **Install [Node.js](https://nodejs.org/en/download/)**, which includes NPM.

 2. **Install `you-win` globally**.

    ```sh
    $ npm install -g you-win
    ```


## Getting Started ##

Open a terminal (**Command Prompt** on Windows, **Terminal** on macOS/Linux).

  * Use the `cd` command to move into the directory of your choice.
  * Start a new project, by typing:

    ```
    you-win first.js
    ```

This will create a new game from the `you-win` template, which should save you a bit of typing.

Open the `first.js` file you just created in your favourite text editor: for example **Gedit** (Ubuntu only), **VSCode**, **Brackets**, or **Sublime Text**. The template should look [like this](https://github.com/livewires/you-win/blob/master/template.js).

Back in your Terminal, you should see a web address output to the console, eg `http://192.168.1.10:8000/`. Open that address in a web browser, preferably **Chromium** or **Google Chrome**. (You can also open the same link on your phone.)


## Credits ##

* Emoji artwork provided by [EmojiOne](https://www.emojione.com/). A kid-friendly subset of emoji are included with the `you-win` dibstribution. The images are scaled down and palletised for compression and "retro" look. I believe this complies with the [Free License Agreement](https://d2gx6z0drfblcq.cloudfront.net/license-free.pdf).
* Included font Munro from [Ten by Twenty](http://tenbytwenty.com/?xxxx_posts=munro).
* Portions adapted from [nathan/phosphorus](https://github.com/nathan/phosphorus)
* `emitter.js` adapted from [nathan/v2](https://github.com/nathan/v2/blob/5ce1713a757a0b6993d003b532072bc093598860/emitter.js)
* Descended from [livewires/run-game](https://github.com/livewires/run-game) and the [Livewires Python Course](https://github.com/livewires/python)


---
title: Install
---

## Install Chrome

You need Chrome or Chromium running on a desktop.

  * **On Windows**:
  If you don't already have it, download from [Google](https://www.google.com/chrome/)
  * **On Ubuntu**:

    ```bash
    apt install chromium-browser
    ```

You need Chrome running on an Android. (If you want to debug on a phone - not essential)

  * Either install Chrome from [APK Mirror](https://www.apkmirror.com/apk/google-inc/chrome/);
  * or install Chrome from the Play Store, which requires a Google account.


## Option #1: Glitch

You can use **[Glitch](https://glitch.com)** to code a mobile game, without installing anything.

Open our [you-win template](https://glitch.com/edit/#!/you-win-template?path=app.js:17:0), **remix** it, and start coding immediately!


## Option #2: Node.js

If you prefer, you can **install** `you-win` to your computer.

 1. **On Windows**

    * **Install [Node.js](https://nodejs.org/en/download/)**, which includes NPM.

    **On Ubuntu**, run the following in a Terminal:

    ```bash
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo apt-get install -y build-essential
    ```
        
 2. **Install `you-win`** globally.

    Run the following in your shell (**Command Prompt** on Windows, **Terminal** on macOS/Linux):

    ```sh
    npm install -g you-win
    ```

 3. **Start a new project** or **run your existing one!**
 
    In your shell, use the `cd` command to move into your Documents folder (or whichever directory your files are already in).

    ```sh
    cd Documents
    ```

    Run the `you-win` command to make a new project:

    ```sh
    you-win first.js
    ```

**If you are trying to start an existing project**, replace `first.js` with your filename (maybe it is `game.js`). You can now skip directly to the section below that says "To run your game".

**If you're starting a new project**, this will create a new game from the `you-win` template, which should save you a bit of typing.

Now open the `first.js` file you just created in your favourite text editor. Text editors include **Gedit** (Ubuntu only), **VSCode**, **Brackets**, or **Sublime Text** (search these online to find them, at Livewires we use VSCode).

The template should look [like this](https://github.com/livewires/you-win/blob/master/template.js):

```js
const uw = require('you-win')
const {Phone, World, Sprite, Text, Polygon} = uw

// Load everything we need
await uw.begin()

// Make the world
var world = new World
world.title = ''
world.background = 'white'

// Now we can start making Sprites!

```

To run your game:

* Open <http://localhost:8000> in Chrome on your computer.
* In your Terminal, you should see a web address output to the console, eg `http://192.168.1.10:8000/`. Open that address on your Android. If you don't want or need remote debugging you can open it on any phone that's on your network (wifi) to see what it looks like.

## Problems?

If you were at LiveWires and are having trouble getting your program to run, come find us on the [forums](http://forums.livewires.org.uk) and we'll try and help you.

## Remote Debugging

### ADB Driver

First, make sure you have the Android ADB driver installed.

  * **On Ubuntu**:

    ```sh
    apt install android-tools-adb
    ```

    Make sure you're in the `plugdev` group.

    ```sh
    sudo usermod -aG plugdev $LOGNAME
    ```

  * **On Windows:** [Install the OEM driver](https://developer.android.com/studio/run/oem-usb.html#InstallingDriver) from your manufacturer.

  * **On macOS:** "It just works. Skip this step."


### USB Debugging

You need an Android running 4.2 or later (e.g. a Galaxy S3 or newer).

On your Android phone:

 1. In **Settings**, find **About phone**, and tap **Build number** 7 times. This should [enable Developer Options](https://developer.android.com/studio/debug/dev-options.html).
 2. Go back, and open **Developer Options**. Enable **USB Debugging**.
 3. Use a micro USB cable to connect your Android to your computer. Make sure to **Allow USB Debugging** on your phone.

On your desktop:

 1. In Chrome, [open DevTools](https://developers.google.com/web/tools/chrome-devtools/#open) (<kbd>Ctrl+Shift+J</kbd>; or <kbd>⌥⌘J</kbd> on Mac). Go to **More Tools** → **Remote devices**. Make sure **Discover USB Devices** is ticked.
 2. Find the `you-win` tab running on your phone, and click **Inspect**.

Now you can see a preview of your phone on the computer--but more importantly, you can see any error messages which appear! 
 
Read Google's [Remote Debugging article](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/#discover) for more details.


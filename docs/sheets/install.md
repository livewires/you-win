---
title: Install
---

## Install Chrome

You need Chrome or Chromium running on a desktop.

  * **On Ubuntu**:

    ```bash
    apt install chromium-browser
    ```

You need Chrome running on an Android.

  * Either install Chrome from [APK Mirror](https://www.apkmirror.com/apk/google-inc/chrome/);
  * or install Chrome from the Play Store, which requires a Google account.


## Option #1: Glitch

You can use **[Glitch](https://glitch.com)** to code a mobile game, without installing anything.

Open our [you-win template](https://glitch.com/edit/#!/you-win-template?path=app.js:17:0), **remix** it, and start coding immediately!


## Option #2: Node.js

If you prefer, you can **install** `you-win` to your computer.

 1. **Install [Node.js](https://nodejs.org/en/download/)**, which includes NPM.

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

 3. **Start a new project!**
 
    In your shell, use the `cd` command to move into your Documents folder.

    ```sh
    cd Documents
    ```

    Run the `you-win` command to make a new project:

    ```sh
    you-win first.js
    ```

This will create a new game from the `you-win` template, which should save you a bit of typing.

Now open the `first.js` file you just created in your favourite text editor. Text editors include **Gedit** (Ubuntu only), **VSCode**, **Brackets**, or **Sublime Text**.

The template should look [like this](https://github.com/livewires/you-win/blob/master/template.js):

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

To run your game:

* Open <http://localhost:8000> in Chrome on your computer.
* In your Terminal, you should see a web address output to the console, eg `http://192.168.1.10:8000/`. Open that address on your Android.


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


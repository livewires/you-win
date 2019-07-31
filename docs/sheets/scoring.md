---
title: "Scoring"
---

# Scoring

TODO

## Text

We've seen how to do images; now let's add some text to the screen.

When someone starts programming, it's traditional to for them to introduce themselves by saying "Hello world!". Let's do that now.

  * Create a `Text` object.
  
    ```js
    var label = new Text
    label.text = "Hello world!"
    ```

  * Change it to red.

    ```js
    label.fill = 'red'
    ```

You can use any of the color names which are supported by HTML. If you give a color name that it doesn't recognise, you'll proabably just get black. 

If you want other colors, instead of named colors you can use colors like `'#007de0'`. There are called a "hex code", short for hexadecimal. You can choose your own hex code color with an online [color picker](https://www.google.co.uk/search?q=color+picker).

  * Change it to your favourite color.

    ```js
    label.fill = '#007de0' // whatever you fancy really


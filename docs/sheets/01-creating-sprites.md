---
title: "01: Creating Sprites"
---
# Creating Sprites

We can add images to the World by creating `Sprites`. A Sprite is an image on the screen, which we can move about, rotate, flip, scale, make transparent, and so on.

Let’s make our first sprite. Add this at the bottom of your program, after all the World-related code.
```js
var player = new Sprite
player.costume = '💩'
```

👉 Save. Check that a tiny poop appears in the middle of the screen!

You can find costumes using the emoji picker at [emoji.blob.codes](http://emoji.blob.codes/). Once you've found the one you want, **click on it to copy it**. You can then **paste** it into your program. Make sure it's in quotes.

Change the poop to your favourite emoji.

👉 Save, and check the emoji changes.

## Bigger and smaller

We can change the size of a sprite using the `scale` attribute. Let's make our sprite twice as big.

👉 Add this at the bottom of your program, after creating the Sprite.
```js
player.scale = 2.0
```

## Transparency

We can (partially) hide our sprite using the `opacity` attribute, which is a number between 0 and 1, starting at `1.0`.

👉 Try different values for the opacity. What happens if you set it to zero?
```js
player.opacity = 0.5
```

## Rotating

You can rotate a Sprite using the `angle` attribute, which is a number in degrees, starting at zero.

<img src="static/sprite-angle.png" width=180>

👉 Try different values for the angle.
```js
player.angle = 30
```

## Mirroring the costume

You can flip the Sprite's costume using the `flipped` attribute. This is a boolean attribute, so it is either `true` or `false`. It starts off as `false`.

👉 Try flipping your sprite's costume.
```js
player.flipped = true
```

Hint: this won't make any difference if the emoji you chose is symmetric to start with! 🙃 

---

➡️ Now, let's learn how to [position our sprites](02-position) on the screen...

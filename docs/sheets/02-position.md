---
title: "02: Positioning"
---

# Positioning

Sprites start off in the center of the screen. Let's look at how to put them in different places!

There are two main ways: setting the X/Y co-ordinate of its center, or setting the X/Y co-ordinate of one of its edges.

## Setting the center

We can change the position of a sprite on the screen using the `posX` and `posY` attributes. These are the co-ordinates of the center of the sprite, starting from the bottom-left corner of the screen.

<img src="static/sprite-xy.png" width=240>

Center your sprite on the X/Y co-ordinate `(100, 200)`.

```js
player.posX = 100
player.posY = 200
```

👉 Check the sprite is no longer in the middle of the screen.


## By the edges

We can also set the X/Y position of **edges** of the sprite, using the attributes `.top`, `.bottom`, `.left`, and `.right`.
 
The left edge of the screen has an X co-ordinate of zero.

👉 Move the player to touch the left edge of the screen.

```js
player.left = 0
```

The right edge of the screen has an X co-ordinate equal to the width of the world.

👉 Now move the player to the right edge of the screen, instead. (You can delete the line setting its `left` edge, since we're not using that anymore.)

```js
player.right = world.width
```
 
The bottom edge of the screen has an Y co-ordinate of zero.

👉 Move the player to touch the bottom edge of the screen.

```js
player.bottom = 0
```

The top edge of the screen has a Y co-ordinate equal to the height of the world.

👉 Now move the player to the top edge of the screen, instead. (You can delete the line setting its `bottom` edge, since we're not using that anymore.)

```js
player.top = world.height
```

---

➡️ Now, let's [introduce a little randomness](03-random)...


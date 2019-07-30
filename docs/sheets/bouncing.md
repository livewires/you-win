---
title: "Bouncing"
---

# Bouncing

This sheet explains how to make a sprite move around, and bounce off different corners of the screen.

## Making a sprite

> **Skip this step if you already have a sprite!**

```js
var ball = new Sprite
ball.costume = '🏀'
```

## Moving the ball

For our ball to bounce, we need to "remember" which edge of the screen we bounced off last. Otherwise the computer won't know which way to move the ball.

So we introduce two variables -- one for the movement in the X direction (left or right), and one for the movement in the Y direction (up or down).

```js
var speedX = -2
var speedY = 0
```

We'll call them `speedX` and `speedY`, short for "velocity" (which means speed). We've chosen `-2` and `0` to start the ball moving off to the left.

Now, let's move the ball a little bit each frame.

```js
ball.forever(() => {
    ball.posX += speedX
    ball.posY += speedY
})
```

👉 Save, and check your ball starts moving to the left.

## Bouncing off the left and right edges

When the ball hits the left edge, we want to switch back to moving to the right again. We know the left edge of the screen has an X coordinate of zero. So we can check if we're touching the left edge by comparing the left edge of our sprite with zero. 

Add this **inside the `ball.forever` block**.
```js
    if (ball.left < 0) {
      speedX = -speedX
      ball.left = 0
    }
```

👉 Save, and check your ball bounces off the left edge.

When the ball hits the right edge, we want to start moving to the left instead. We know that the right edge of the screen has an X coordinate equal to the width of the world. So we can check if we're touching the right edge by comparing the right edge of our sprite with the width of the world.

Add this inside the forever block.
```js
    if (ball.right > world.width) {
      speedX = -speedX
      ball.right = world.width
    }
```

👉 Save, and check your ball bounces off the left and right edges.

## Bouncing off the bottom and top edges

Change the initial value of `speedY` to `-2`.

👉 Save, and check the ball now moves to the bottom-left.

To make the ball bounce off the bottom edge of the screen, you need to add another `if` block. Hint: you want to compare `ball.bottom` with something, and then update `speedY`.

👉 Make the ball bounce off the bottom edge.

Now add a final `if` block to make the ball bounce off the top edge of the screen. Hint: you want to compare `ball.top` with `world.height`.

👉 Make the ball bounce off the top edge.

## Done

Your sprite should now move around and bounce off all four corners of the screen!


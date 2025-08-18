---
title: "03: Randomness"
---

# Randomness

Let's introduce some uncertainty into our creation.

<!-- TODO What is randomness? -->

We can use `uw.randomInt(a, b)` to pick a random number between `a` and `b`. (This is just like `pick random _ to _` from Scratch.)

For example, `uw.randomInt(1, 10)` gives a random number between `1` and `10`.


## Random position

Let's start our sprite off in a random place on the screen.

👉 Set your sprite to a random X position.

```js
player.posX = uw.randomInt(0, world.width)
```

👉 Set your sprite to a random Y position.

_Hint: you'll need to add another line, which uses `world.height`._

👉 Check that each time you refresh, the sprite moves to a different place on the screen!


## Random angle

Let's point our sprite in a random direction.

```js
player.angle = uw.randomInt(1, 360)
```

👉 Check that each time you refresh, the sprite points in a different direction.


---

➡️ Next, let's [learn how to animate things](04-forever)...


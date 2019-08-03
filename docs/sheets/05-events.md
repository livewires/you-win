---
title: "05: Events"
---

# Events

So far our game isn't very interactive: you can't control anything. Let's change that.


## Taps

We can use `world.onTap` to detect when the screen is tapped. Make sure this is **at the bottom of your program**, outside any `forever` blocks.

```js
world.onTap(e => {
    alert("dont touch this")
})
```

Make sure you get the brackets right.

👉 Save, and check a message appears when you tap (or click) the screen.


## Gravity

For example, we can have our sprite fall down, but jump when you tap the screen.

To do this we'll need a variable, let's call it `speedY`, which tells us which direction the sprite is moving in. We'll move the sprite by that amount each frame. 

Let's make the player fall down due to gravity. Make sure this **replaces any existing `player.forever` blocks**.

```js
var speedY = 0

player.forever(() => {
    player.posY += speedY  // move the player

    speedY -= 0.2  // fall down because of gravity
})
```

Now let's make the player jump when we tap the screen.

```
world.onTap(e => {
    speedY += 5   // jump
})
```

<!-- TODO we kinda need a dampening force -->

---

Let's see [what to do next](06-recipes)...

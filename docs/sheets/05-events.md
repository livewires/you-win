---
title: "05: Events"
---

# Events

So far our game isn't very interactive: you can't control anything. Let's change that.


## Taps

We can use `world.onTap` to detect when the screen is tapped.

```js
world.onTap(e => {
    alert("dont touch this")
})
```

Make sure you get the brackets right.

👉 Save, and check a message appears when you tap (or click) the screen.



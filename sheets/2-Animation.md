# Intro #2: Animation

animation, movement, conditionals, trig

- UW.forever ✔
- assign-increment ✔
- phone.zAngle ✔
- events ✔
- movement. UW.sin, UW.cos, UW.atan2 ✔
- conditions. ✔
- !Sprite.isOnScreen ✔
- destroy ✔
- setInterval? counter?

## Animation

So far, we've only set up static scenes. We've learnt how to position different kinds of objects on the screen, and change how they look; but we haven't moved them or changed them after initialisation.

**Animation** means to give an appearance of movement. We do this by **changing values over time**.

  * First, start a **new project**, and make a Sprite with your favourite emoji.

    ```js
    var face = new Sprite({
      costume: '🐮',
    })
    ```


### Forever

We need a way to react to time passing. We do this by using **`forever`** to run code on every _frame_.

```js
forever(() => {
  // do stuff
})
```

An app draws a new frame on the screen roughly 60 times a second (or 60 **FPS**, frames per second).

We can use `forever` to make our sprite spin!

  * Add a `forever` block, right after you create your `Sprite`.

    ```js
    forever(() => {
      face.angle += 1
    })
    ```

In JavaScript, `x += 1` is shorthand for `x = x + 1`. You can read it as "change by".

By increasing the angle of the sprite on every frame, our sprite will slowly rotate clockwise.

  * **Challenge:** make the sprite rotate anticlockwise.

Now we know the basics of animation, lets try some simple movement.

  * Instead of rotating, move the Sprite right.

    ```js
    forever(() => {
      face.x += 2
    })
    ```

You can make the sprite move faster by increasing the number `2`, since the sprite will move further on each frame.

  * **Challenge**: experiment with animating other properties, like increasing scale:

    ```js
    // ...
      face.scale *= 1.05
    ```


## Orientation

TODO
Read the phone's accelerometer to get the phone's being held at, compared to gravity.

First, we need to initialise a `Phone` object, so that `you-win` knows to start reading the phone's orientation sensors.

  * Put this near the top of your program, after the `import` lines.

    ```js
    var phone = new Phone()
    ```

  * Rotate the sprite when the phone rotates.

    ```js
    forever(() => {
      face.angle = phone.zAngle
    })
    ```

  * **Challenge**: what happens if you use negative `zAngle`?


## Events

Let's have our face shoot out a projectile toward our finger when we tap.

  * Delete (or comment out) the `forever` block for now -- we won't need it until later.

  * Use `on('tap')` to detect when the screen is tapped.

    ```js
    world.on('tap', e => {
      alert("don't touch this")
    })
    ```

The code inside the `on(...` block runs whenever the screen is tapped.  So whenever you tap (or click) the screen, the message "don't touch this" should appear.

That gets boring quickly, so let's make a projectile.

  * When the screen is tapped, make a bullet under your finger.

    ```js
    world.on('tap', e => {
      var bullet = new Sprite({
        costume: '👾',
        x: e.fingerX,
        y: e.fingerY,
      })

      // TODO: move the bullet ...
    })
    ```

What's going on here? `e` is an **event** object, telling us the details of the **tap** event. The `e.fingerX` and `e.fingerY` attributes tell us the coordinates of the tap.

Now let's try moving our projectile!

  * Add a `forever` block to move the Sprite we created after the tap.

    ```js
    world.on('tap', e => {
      // ... [make the bullet]

      forever(() => {
        bullet.x += 3
        bullet.y += 3
      })
    })
    ```

Since the `forever` block is inside the `on`, it too runs on every `tap`; and the `bullet` variable that it refers to is the one we just created. (This phenomenon is called "scope"; more about that in [Intro #4: Functions](4-Functions.md).


## Trig

Sometimes we want to move things at an angle--and to do this, we need **trigonometry**!

It'd be really neat if our bullets started at the face, and travelled outward toward the point where we tapped. Then it would feel more like a "cannon" sort-of game.

  * **Challenge**: make the bullets start at the same position as the `face`.

I'm not going to explain all of trig here, since that would be boring. For the purposes, we only need to know two things:

1. You can use `.x += UW.sin(angle)` and `.y += UW.cos(angle)` to move a sprite at an angle.
2. You can use `angle = UW.atan2(dx, dy)` to work out the angle you need to move something in a direction.

Currently, our bullets all go at 45°, which is dull. Let's fire them out at a random angle.

  * **Challenge**: create the bullets with a random initial direction.

    _Hint: you want to set their `angle` to a random number between `1` and `360`._

  * Now move them at that angle by replacing your `forever` block.

    ```js
    world.on('tap', e => {
      // ... [make the bullet, with random angle]

      forever(() => {
        bullet.x += 4 * UW.sin(bullet.angle)
        bullet.y += 4 * UW.cos(bullet.angle)
      })
    })
    ```

By multiplying `sin` and `cos` by 4, we increase the speed of movement.

So we've done the first part -- moving the bullets in a direction.

Now to work out the correct angle! We need to use `atan2` for this. This is a special version of inverse _tan()_ which takes two numbers--a difference in `x` and a difference in `y`--and returns the correct angle.

  * Use `atan2` to get the correct angle.

    ```js
    world.on('tap', e => {
      var bullet = new Sprite({
        // ... [go to face]
        angle: UW.atan2(e.fingerX - face.x, e.fingerY - face.y),
      })

      // ... [move at an angle]
    })
    ```

Congrats! We've just made a... face-cannon... thing.


## Conditions

Animation is all very well, and we've learnt how to react to _events_. But how can we react to other things changing?

A **condition** is an expression that's either `true` or `false`. They look like this:

1. `x === y` -> x is equal to y
1. `x !== y` -> x is not equal to y
2. `x < y` -> x is less than y
2. `x <= y` -> x is less than or equal to y
3. `!p` means **not** -> `true` if p is `false`, and vice-versa
4. `p && q` means **and** -> `true` only if both p and q are `true`
5. `p || q` means **or** -> `true` if either of p or q is `true`

Here are some examples. These are all `true`:

1. `1 !== 2`
2. `42 === 42`
3. `"moo" === "moo"`
4. `10 < 42`
5. `!(false)`
6. `true && true`
7. `false || true`

Finally, there's a really important condition built-in to moo. It's a function attached to a Sprite, and it's called `.isTouching(otherSprite)`. More about that later!

Let's see what we can do with conditions.

  * First, make our cannon-face move again.

    ```js
    var velocity = 2

    forever(() => {
      face.x += velocity
    })
    ```

We're moving him to the right (increasing x). This time, we're using a variable to store its speed. We'll need this to be a variable so we can change it later.

  * Now, let's have it bounce off the right edge.

    ```js
    forever(() => {
      face.x += velocity
      if (world.width < face.right) {
        velocity = -2
      }
    })
    ```

We do this by comparing his `right` edge to the width of the world. If his right edge is greater than the width of the world, then he's gone off the right-hand side of the screen; so we set his velocity negative, so he starts moving left instead.

  * Flip the costume, for good measure...

    ```js
        // ...
        face.flipped = !face.flipped
    ```

  * **Challenge:** make it bounce off the left edge too.

    You'll need to add a second `if` block.

    Hint: the left-hand side of the world is where `x = 0`...

  * Check that the bullets still come from the face, and head toward your finger!

Finally, if we don't destroy the bullets, eventually the game will get really slow! Let's fix that, by destroying them once they're completely off the screen:

  * Destroy the bullets once they're completely off-screen.

    **Challenge**: where should this go?

    ```js
        if (!bullet.isOnScreen()) {
          bullet.destroy()
        }
    ```

The `destroy()` function attached to a Sprite removes it from the screen permanently.

However, we haven't quite cleaned up after ourselves--the forever block for the bullet will keep running, even though it's no longer on screen! This isn't super-important, but in larger games it might cause us to run out of memory. So let's `return false` to stop the `forever` block from running:

  * We should also `return false`, to make sure the `forever` block stops.

    ```js
        if (!bullet.isOnScreen()) {
          bullet.destroy()
          return false // stop this forever block
        }
    ```


## Other ideas

* `setInterval` --for fraction-of-a-second granularity, rather than every frame


---
title: Game
---

# The Infinite Jumping Game

The game is about bouncing on platforms to get higher and higher...forever. Your score is based on how high you can jump.


## Gravity

The first thing to do is to make our player fall down.

We can simulate gravity using a **constant acceleration**. As you should know from Maths or Physics class, that means we need to keep track of **velocity** (speed and direction). Let's add a variable for just that.

  * Add a variable called `velY`, which stores a number.

    ```js
    var velY = -2
    ```

  * Add a `forever` loop for the player.

    ```js
    player.forever(() => {
        player.posY += velY
    })
    ```

Save. You'll notice the player falls at a constant speed, which isn't right at all! Let's change velocity over time, to simulate gravity:

  * Decrease velocity, so the player falls.

    <s>
    ```js
    var velY = -2
    ```
    </s>

    ```js
    var velY = 0

    player.forever(() => { // player
        player.posY += velY
        velY -= 2               // <-- add this line
    })
    ```


## Platforms

Now our player falls down! Let's add some platforms for him to bounce on. (We won't do the bouncing part just yet; that'll have to wait for later.)

  * Create a `platform`. This is going to be a `Polygon` instead of a `Sprite`.

    ```js
    var platform = new Polygon
    platform.points = [[-30, 0], [30, 0], [30, 10], [-30, 10]]
    platform.posY = 100
    ```

  * Set the `fill` and `outline` colors for your Polygon, to taste.

  * Tweak the size of your platform as necessary. You can do this by changing its `points`.

Save. Check the platform appears below the player!

  * But wait, the outline doesn't go all the way around! That's because we've only given it four points to connect so it doesn't know to connect the last one to the first one. We could add the first point again to the end of the set of points or we could use the handy `platform.closed`.


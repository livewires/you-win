---
title: "Scrolling"
---

# Scrolling

TODO

## TODO

Now we've got some platforms to climb, we need to add scrolling so we can move up the platforms.

In _Doodle Jump_, the screen only ever scrolls up; never down. This is because the way for the game to end, is for the player to fall off the bottom of the screen!

We can scroll by changing `world.scrollY`. The `.scrollX` and `.scrollY` values are an **offset** added to the position of everything in the world, so you can use them to scroll around.

We only want to scroll up, never down. We can do this by comparing the player's height, `player.posY`, with the current scroll position, `world.scrollY`.

  * Scroll up when the player is near the top of the screen.

    ```js
    if (world.scrollY < player.posY - 300) {
        world.scrollY = player.posY - 300
    }
    ```
    _Make sure this goes in the **`player.forever`** block._

You can tweak the number `300` to taste, to control how far up the screen the player has to go for the game to start scrolling. 


## More Platforms!

When we scroll up far enough, we run out of platforms.

We could keep adding more by copy/pasting the `makePlatform()` line, but that doesn't seem sensible; however many we'll have, we'll run out eventually! Let's delete all but one of our `makePlatform()` calls, and have our game make 'em automatically.

To do this, we need to compare the current scroll position, `world.scrollY`, with the Y position of the last platform we made: which we stored in the `lastY` variable.

  * **Challenge:** if the last platform is below the _top_ of the screen, make a new platform.

    _Write this inside the `forever` loop for the **player**._

    _Hint: you'll want to add the height of the screen to `world.scrollY`._ 


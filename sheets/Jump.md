# The Infinite Jumping Game

- attach forever to object 
- explain functions
- (explain Arrays?)


## Starting out

  * Set the `width` and `height` of your world

    ```js
    world.width = 300
    world.height = 460
    ```

  * **Challenge:** create a sprite for your player character. Call it `player`.

    _Have a look back at chapter one, if you've forgotten how to create sprites!_

    Make sure the player is just the right size on the screen of your phone: not too big, not too small.

  * Set the `background` color of your world, to taste.


## Gravity

The first thing to do is to make our player fall down.

We can simulate gravity using a **constant acceleration**. As you should know from Maths or Physics class, that means we need to keep track of **velocity**. Let's add a variable for just that.

  * Add a variable called `velY`, which stores a number.

    ```js
    var velY = -2
    ```

  * Add a `forever` loop for the player.

    ```js
    forever(() => { // player
        player.y += velY
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

    forever(() => { // player
        player.y += velY
        velY -= 2               // <-- add this line
    })
    ```


## Platforms

Now our player falls down! Let's add some platforms for him to bounce on. (We won't do the bouncing part just yet; that'll have to wait for later.)

  * Create a `platform`. This is going to be a `Polygon` instead of a `Sprite`.

    ```js
    var platform = new Polygon
    platform.points = [[-30, 0], [30, 0], [30, 10], [-30, 10]]
    platform.y = 100
    ```

  * Set the `fill` and `outline` colors for your Polygon, to taste.

  * Tweak the size of your platform as necessary. You can do this by changing its `points`.

Save. Check the platform appears below the player!


## Bouncing

Currently our player falls through the platform entirely. That's no good! Let's sort that out.

We can use `isTouching` to check for collisions between different objects. `isTouching` returns a Boolean value (`true` or `false`), which we can use inside an `if` condition.

  * Check if the platform is touching the player.

    ```js
    forever(() => { // platform
        if (player.isTouching(platform)) {
            // ...jump...
        }
    })
    ```

  * To jump, we want to **set** the player's Y velocity to be a large, positive number. Let's try `10`.

    ```js
            velY = 10
    ```
    _Add this inside the `if` condition you just wrote._


## Functions

A game with just one platform isn't any good, so we need to make some more. But we don't want to copy/paste the code every time we make a platform--that would be no good at all!

What we want to do is to move the code for making a platform into a **function**. A function (aka. procedure, aka. "custom block" from Scratch) lets you give a **name** to a piece of code, so you can refer to it by name.

  * Move the platform code into a function, by adding `function makePlatform( ) {` at the beginning of that section, and `}` at the end.

    ```js
    function makePlatform() {
      //...[all your platform code]...
    }
    ```
    _Put the `function` bits **around** your existing code._

    You'll want to re-indent your code at this point--try selecting the code inside the function, and pressing the <kbd>Tab</kbd> key.

Save. You'll notice the platform disappears. This is because we haven't **called** our function; we've defined it, but not used it yet! Let's do that now.

  * Make a platform by calling your new function.
  
    ```js
    makePlatform()
    ```
    _Add this at the end of your program, before the final `})`._

Now we can easily make more platforms!

  * Add some more platforms.

    ```js
    makePlatform()
    makePlatform()
    makePlatform()
    // ...
    ```

The platforms are all being made at the same height! That's no good; we want to make each platform higher than the last. Let's make a variable at the beginning of our program, to keep track of the height of the last one...

  * Create a `lastY` variable.

    ```js
    var lastY = 100
    ```
    _Add this before the `makePlatform` function._

Make sure not to put this _inside_ `makePlatform`, or you'll get a **different** version of the `lastY` variable each time. We need to remember it between calls to our function, so it has to go outside of it.

Now let's use it.

  * Use `lastY` inside `makePlatform`.
    
    ```js
        platform.y = lastY
    ```

  * **Challenge:** increase `lastY` every time you make a platform.

    _Make sure you do this **inside** `makePlatform`!_


## Scrolling

Now we've got some platforms to climb, we need to add scrolling, so that we can move up the platforms.

In _Doodle Jump_, the screen only ever scrolls up; never down. This is because the way for the game to end, is for the player to fall off the bottom of the screen!

We can scroll by changing `world.scrollY`. The `.scrollX` and `.scrollY` values are an **offset** added to the position of everything in the world, so you can use them to scroll around.

We only want to scroll up, never down. We can do this by comparing the player's height -- `player.y` -- with the current scroll position -- `world.scrollY`.

  * Scroll up when the player is near the top of the screen.

    ```js
    if (world.scrollY < player.y - 300) {
        world.scrollY = player.y - 300
    }
    ```

You can tweak the number `300` to taste, to control how far up the screen the player has to go for the game to start scrolling. 


## More Platforms!


## Bouncing, take 2

XXX need to check we're moving down

  * XXX

    ```js
    platform.isTouching(player) && velY < 0)
    ```


## Movement

In _Doodle Jump_, the player moves when you tilt the phone.

We can read the phone's accelerometer to get the angle the phone's being held at, compared to gravity.

Like last time we did this  
First, we need to initialise a `Phone` object, so that `you-win` knows to start reading the phone's orientation sensors.


  * Put this near the top of your program, after the `import` lines.

    You might find a commented out-line already, in which case just uncomment it!

    <s>
    ```js
    // var phone = new Phone
    ```
    </s>

    ```js
    var phone = new Phone
    ```

Now we can use `phone.zAngle` to get the **angle** at which the phone is held. But we need a **difference in X**. Think back to the bullets from chapter two: to turn an angle into a difference in X, we use trig--specifically, `UW.sin`.

  * Move the player horizontally when the phone is tilted.

    ```js
    player.x += 5 * UW.sin(phone.zAngle)   // adjust `5` to taste
    ```
    _Inside the `forever` for the player._

The number `5` is a multiplier controlling how **fast** the player moves when you tilt the phone. Adjust it until it feels right to you.


### Wrapping ###

XXX

  * Wrap when we go past the right-hand side of the screen.
  
    ```js
    if (player.x > world.width) {
      player.x = 0
    }
    ```
    _Inside the `forever` for the player._
  
  * Challenge: wrap when you go past the left-hand side of the screen.


## Shooting


## Moving Platforms


## Moving Platforms



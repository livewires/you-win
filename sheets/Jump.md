
- initialisers, move required props to args @done
- import Rect @done
- attach forever to object 
- explain variables @done
- explain "change by"
- explain functions
- (explain Arrays?)

- world: color, size
- player: costume, scale
- gravity
- platform
- colliding with platforms
- moving platform to function
- increasing height when we make each function
- collide+vy<0
- scrolling: world.scrollY should be *at least* player.y - 300
- movement
- wrapping: if (x < 0) x += world.with &vv.


## Orientation

**TODO**: don't repeat this here and in chapter 2

We can read the phone's accelerometer to get the angle the phone's being held at, compared to gravity.

First, we need to initialise a `Phone` object, so that `you-win` knows to start reading the phone's orientation sensors.

  * Put this near the top of your program, after the `import` lines.

    ```js
    var phone = new Phone
    ```

  * Rotate the sprite when the phone rotates.

    ```js
    forever(() => {
        face.angle = phone.zAngle
    })
    ```

  * **Challenge**: what happens if you use negative `zAngle`?



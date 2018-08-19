
const uw = require('you-win')
const {Phone, World, Sprite, Text, Polygon} = uw

var phone = new Phone

// Load everything we need
await uw.begin()

// Make the world
var world = new World
world.title = ''
world.background = 'white'

// Now we can start making Sprites!


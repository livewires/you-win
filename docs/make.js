
const fs = require('fs')

const Metalsmith = require('metalsmith')
const markdown = require('metalsmith-markdown')
const layouts = require('metalsmith-layouts')
const paths = require('metalsmith-paths')
const headings = require('metalsmith-headings')


const Handlebars = require('handlebars')
Handlebars.registerHelper('eq', (a, b) => a === b)

/*
const debug = (files, metalsmith, done) => {
    setImmediate(done)
    console.log(metalsmith.metadata().collections.articles)
    console.log(metalsmith.metadata().collections.articles[0].paths)
}
*/

const docs = articles => (files, metalsmith, done) => {
    setImmediate(done)
    Object.assign(metalsmith.metadata(), {
        docs: articles.map(name => {
            const f = files[name + '.md']
            f.isDoc = true
            return f
        }),
    })
}

const m = Metalsmith(__dirname)
m.metadata({
    version: require('../package.json').version,
    css: fs.readFileSync('static/theme.css', 'utf-8'),
})
m.source('sheets/')
m.destination('.')
m.clean(false)
m.use(paths({
    property: 'paths'
}))
m.use(docs([
    // Tutorial
    '1-Numbers',
    '2-Animation',
    '3-Arrays',
    '4-Functions',

    // games
    'Jump',

    // API
    'Reference',
]))
//m.use(debug)
m.use(markdown({
    smartypants: true,
    gfm: true,
}))
m.use(headings('h2'))
m.use(layouts({
  engine: 'handlebars',
  default: 'default.html',
}))
m.build(function(err) {
    if (err) throw err;
})



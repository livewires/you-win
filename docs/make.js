
const fs = require('fs')

const Metalsmith = require('metalsmith')
const markdown = require('metalsmith-markdown')
const layouts = require('metalsmith-layouts')
const paths = require('metalsmith-paths')
const headings = require('metalsmith-headings')
const pdf = require('./pdfs')
const emoji = require('metalsmith-emoji')


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
    css: fs.readFileSync('static/theme.css', 'utf-8')
        .replace(/\/\*[^\/]*\*\//g, '')
        .replace(/ *\n */g, ''),
})
m.source('sheets/')
m.destination('.')
m.clean(false)
m.use(paths({
    property: 'paths'
}))
m.use(docs([

    'install',

    // Tutorial
    '1-numbers',
    '2-animation',
    '3-arrays',
    '4-functions',

    // games
    'jump',

    // api
    'reference',

]))
//m.use(debug)
m.use(markdown({
    smartypants: true,
    gfm: true,
}))
m.use(emoji({
    convertToImages: true,
    processShortnames:  false,
}))
m.use(headings('h2'))
m.use(layouts({
    engine: 'handlebars',
    default: 'default.html',
}))
m.use(pdf({
    format: 'A4',
    printBackground: true,
}))
m.build(function(err) {
    if (err) throw err
})



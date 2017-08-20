
const path = require('path')

const chromeLauncher = require('chrome-launcher')
const CDP = require('chrome-remote-interface')


async function launchChrome() {
    return await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu'],
    })
}

async function closeChrome(chrome) {
    const protocol = await CDP({port: chrome.port})
    await protocol.close()
    await chrome.kill()
}

async function newPage(chrome, url) {
    const target = await CDP.New({port: chrome.port})
    const client = await CDP({target})
    const {Page} = client
    await Page.enable()
    await Page.navigate({url, referrer: ''})
    await Page.loadEventFired()
    return {chrome, Page, client}
}

async function domChanged(client) {
    const browserCode = () => {
        return new Promise(done => {
            new MutationObserver(() => done()).observe(document.body, {
                childList: true,
            })
        })
    }
    const {Runtime} = client
    await Runtime.evaluate({
        expression: `(${browserCode})()`,
        awaitPromise: true,
    })
}

async function renderPDF({chrome, Page, client}, options) {
    const {data} = await Page.printToPDF(Object.assign({
        format: 'A4',
    }, options))
    return Buffer.from(data, 'base64')
}

async function closePage({chrome, Page, client}) {
    await CDP.Close({port: chrome.port, id: client.target.id})
}

async function renderPdfs(files, metalsmith) {
    // find html files
    const htmlPages = []
    for (let name of Object.keys(files)) {
        if (/x?html?/i.test(path.extname(name))) {
            htmlPages.push(name)
        }
    }

    // launch Chrome
    const chrome = await launchChrome()

    // open a tab to render each PDF
    const promises = htmlPages.map(async (name, index) => {
        const html = files[name].contents
        const url = 'data:text/html;base64,' + html.toString('base64')

        let tab, buffer
        try {
            tab = await newPage(chrome, url)
            buffer = await renderPDF(tab)
            closePage(tab)
        } catch (err) {
            console.error(`Error rendering '${name}' to PDF:\n${err}`)
            throw err
        }

        files['pdfs/' + name.replace(/\.x?html?$/i, '.pdf')] = {
            contents: buffer,
        }
    })
    await Promise.all(promises)

    // close Chrome gracefully
    await closeChrome(chrome)
}

module.exports = options => function pdf(files, metalsmith, done) {
    renderPdfs(files, metalsmith, options).then(() => {
        done()
    })
}


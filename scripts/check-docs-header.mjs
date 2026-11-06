// The docs header on a phone: drives the built site in Chromium at phone
// widths and checks that the header is one row whose site title, search
// control and menu button neither overflow it nor overlap, that the title is
// not clipped (below 360px it may be hidden, leaving the logo),
// that the keyboard hint is hidden, and that the compact search
// control still opens the search dialog. Wider than the 50rem breakpoint the
// search control keeps its label, and its keyboard hint shows with a mouse
// but not on a touch screen. Run after `pnpm build`; set
// CHROMIUM to a Chromium binary to use it instead of Playwright's own.
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const root = resolve('dist')
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.png': 'image/png',
}
const server = createServer((req, res) => {
  let path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!path.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.html')
  if (!existsSync(path)) {
    res.writeHead(404).end()
    return
  }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' })
  createReadStream(path).pipe(res)
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const origin = `http://127.0.0.1:${server.address().port}`

const pages = ['/docs/v0.19/', '/docs/v0.19/concepts/']
const failures = []
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM || undefined,
  args: ['--no-sandbox'],
})
try {
  for (const [width, touch] of [
    [320, true],
    [360, true],
    [375, true],
    [414, true],
    [1024, true],
    [1280, false],
  ]) {
    const phone = width < 800
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      isMobile: touch,
      hasTouch: touch,
    })
    const page = await context.newPage()
    for (const path of pages) {
      await page.goto(origin + path)
      const at = `${path} at ${width}px${touch ? ' (touch)' : ''}`
      const header = await page.evaluate(() => {
        const box = (selector) => {
          const element = document.querySelector(selector)
          if (!element || !element.getClientRects().length) return null
          const { left, right, top, bottom } = element.getBoundingClientRect()
          return { left, right, top, bottom }
        }
        const title = document.querySelector('.site-title span')
        return {
          header: box('header.header'),
          title: box('.site-title'),
          search: box('.open-search'),
          menu: box('button.sl-menu-button'),
          // A title hidden on purpose is a 1px visually-hidden box; anything
          // wider that overflows is a title clipped mid-word.
          titleClipped:
            title.getBoundingClientRect().width > 1 && title.scrollWidth > title.clientWidth,
          titleHidden: title.getBoundingClientRect().width <= 1,
          logo: !!document.querySelector('.site-title img')?.getBoundingClientRect().width,
          label: !!document.querySelector('.open-search .search-label')?.offsetWidth,
          hint: !!document.querySelector('.open-search kbd')?.offsetWidth,
        }
      })
      if (phone) {
        const items = { title: header.title, search: header.search, menu: header.menu }
        for (const [name, item] of Object.entries(items)) {
          if (!item) {
            failures.push(`${at}: no visible ${name}`)
            continue
          }
          if (
            item.top < header.header.top ||
            item.bottom > header.header.bottom ||
            item.left < 0 ||
            item.right > width
          )
            failures.push(`${at}: ${name} overflows the header`)
        }
        if (header.title && header.search && header.title.right > header.search.left)
          failures.push(`${at}: title overlaps search`)
        if (header.search && header.menu && header.search.right > header.menu.left)
          failures.push(`${at}: search overlaps the menu button`)
        if (header.titleClipped) failures.push(`${at}: site title is clipped`)
        if (header.titleHidden && width >= 360)
          failures.push(`${at}: site title is hidden though it fits`)
        if (!header.logo) failures.push(`${at}: no logo`)
        if (header.label || header.hint)
          failures.push(`${at}: search shows its label or keyboard hint`)
        await page.click('.open-search')
        if (!(await page.evaluate(() => document.querySelector('docs-search dialog').open)))
          failures.push(`${at}: compact search does not open the dialog`)
      } else {
        if (!header.label) failures.push(`${at}: wide search lost its label`)
        if (header.hint !== !touch)
          failures.push(
            `${at}: keyboard hint ${touch ? 'shows on a touch screen' : 'is missing with a mouse'}`,
          )
      }
    }
    await context.close()
  }
  // Where the title is hidden is a breakpoint in docs.css set by measuring the
  // title; spot widths can miss a breakpoint a few pixels off. Sweep the phone
  // widths so a title clipped anywhere between them fails.
  const context = await browser.newContext({
    viewport: { width: 414, height: 800 },
    isMobile: true,
    hasTouch: true,
  })
  const page = await context.newPage()
  await page.goto(origin + pages[1])
  for (let width = 320; width <= 414; width += 2) {
    await page.setViewportSize({ width, height: 800 })
    const clipped = await page.evaluate(() => {
      const title = document.querySelector('.site-title span')
      return title.getBoundingClientRect().width > 1 && title.scrollWidth > title.clientWidth
    })
    if (clipped) failures.push(`${pages[1]} at ${width}px (touch): site title is clipped`)
  }
  await context.close()
} finally {
  await browser.close()
  server.close()
}
if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(
  'Docs header verified at 320px, 360px, 375px, 414px and 1024px (touch) and 1280px, title swept 320-414px',
)

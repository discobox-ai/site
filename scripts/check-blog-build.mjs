import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseHTML } from 'linkedom'

export function checkBlogBuild() {
  function check(path, url) {
    const document = parseHTML(readFileSync(path, 'utf8')).document
    if (
      document.querySelector('link[rel=canonical]')?.getAttribute('href') !==
      `https://discobox.ai${url}`
    )
      throw Error(`Invalid blog canonical: ${url}`)
    if (!document.querySelector('link[rel=alternate][type="application/rss+xml"]'))
      throw Error(`Missing RSS discovery: ${url}`)
    if (!document.querySelector('[data-pagefind-ignore="all"]'))
      throw Error(`Blog enters docs search: ${url}`)
    if (
      process.env.SITE_PREVIEW === 'true' &&
      !document.querySelector('meta[name=robots][content*="noindex"]')
    )
      throw Error(`Preview indexable: ${url}`)
    for (const element of document.querySelectorAll('a[href], img[src]')) {
      const href = element.getAttribute('href') || element.getAttribute('src')
      const target = new URL(href, `https://discobox.ai${url}`)
      if (target.origin !== 'https://discobox.ai') continue
      const direct = resolve('dist', '.' + decodeURIComponent(target.pathname))
      const output =
        existsSync(direct) && statSync(direct).isFile() ? direct : resolve(direct, 'index.html')
      if (!existsSync(output)) throw Error(`Broken blog link/asset: ${url} -> ${href}`)
      if (
        target.hash &&
        !parseHTML(readFileSync(output, 'utf8')).document.getElementById(
          decodeURIComponent(target.hash.slice(1)),
        )
      )
        throw Error(`Broken blog anchor: ${url} -> ${href}`)
    }
  }
  check('dist/blog/index.html', '/blog/')
  for (const entry of readdirSync('dist/blog', { withFileTypes: true })) {
    if (entry.isDirectory()) check(`dist/blog/${entry.name}/index.html`, `/blog/${entry.name}/`)
  }
  console.log('Built blog links, anchors, canonicals, discovery and indexing verified')
}
if (process.argv[1] === new URL(import.meta.url).pathname) checkBlogBuild()

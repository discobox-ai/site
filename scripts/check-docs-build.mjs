import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';
const manifest = JSON.parse(readFileSync('src/data/docs-versions.json', 'utf8'));
const documents = new Map();
const read = (path) => {
  if (!documents.has(path)) documents.set(path, parseHTML(readFileSync(path, 'utf8')).document);
  return documents.get(path);
};
for (const version of manifest.versions) {
  for (const file of version.files) {
    const url = `/docs/${version.line}/${file.slug ? file.slug + '/' : ''}`;
    const path = `dist${url}index.html`;
    const document = read(path);
    if (document.querySelector('link[rel=canonical]')?.getAttribute('href') !== `https://discobox.ai${url}`) throw Error(`Invalid canonical: ${url}`);
    if (!document.querySelector('[data-pagefind-filter]')?.getAttribute('data-pagefind-filter')?.includes(`version:${version.line}`)) throw Error(`Missing version search filter: ${url}`);
    if (process.env.SITE_PREVIEW === 'true' && !document.querySelector('meta[name=robots][content*="noindex"]')) throw Error(`Preview indexable: ${url}`);
    for (const element of document.querySelectorAll('a[href], img[src]')) {
      const href = element.getAttribute('href') || element.getAttribute('src');
      const target = new URL(href, `https://discobox.ai${url}`);
      if (target.origin !== 'https://discobox.ai') continue;
      const direct = resolve('dist', '.' + decodeURIComponent(target.pathname));
      const output = existsSync(direct) && statSync(direct).isFile() ? direct : resolve(direct, 'index.html');
      if (!existsSync(output)) throw Error(`Broken internal link/asset: ${url} -> ${href}`);
      if (target.hash && !read(output).getElementById(decodeURIComponent(target.hash.slice(1)))) throw Error(`Broken anchor: ${url} -> ${href}`);
    }
  }
}
if (!existsSync('dist/pagefind/pagefind.js')) throw Error('Search index missing');
for (const path of ['dist/index.html', 'dist/architecture/index.html']) {
  if (!read(path).querySelector('[data-pagefind-ignore="all"]')) throw Error(`Marketing page enters docs search: ${path}`);
}
console.log('Built docs routes, links, anchors, canonicals, search metadata and preview indexing verified');

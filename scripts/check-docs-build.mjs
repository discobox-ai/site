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
// /docs/ is a real HTTP redirect to currentStable, from the built _redirects,
// with the meta-refresh page as its fallback; with no stable line it is neither.
const redirects = existsSync('dist/_redirects') ? readFileSync('dist/_redirects', 'utf8') : '';
const docsRules = redirects
  .split('\n')
  .map((line) => line.trim().split(/\s+/))
  .filter(([from]) => from === '/docs' || from === '/docs/');
const fallback = read('dist/docs/index.html').querySelector('meta[http-equiv=refresh]')?.getAttribute('content') ?? null;
if (manifest.currentStable) {
  const target = `/docs/${manifest.currentStable}/`;
  for (const from of ['/docs', '/docs/']) {
    const rules = docsRules.filter(([source]) => source === from);
    if (rules.length !== 1 || rules[0].length !== 3 || rules[0][1] !== target || rules[0][2] !== '302') {
      throw Error(`_redirects must send ${from} to ${target} with a 302 exactly once, for currentStable ${manifest.currentStable}: ${JSON.stringify(rules.map((r) => r.join(' ')))}`);
    }
  }
  if (!fallback?.endsWith(`url=${target}`)) throw Error(`/docs/ fallback page does not point to ${target}: ${fallback}`);
} else {
  if (docsRules.length) throw Error(`_redirects redirects /docs/ with no currentStable: ${JSON.stringify(docsRules.map((r) => r.join(' ')))}`);
  if (fallback) throw Error(`/docs/ redirects with no currentStable: ${fallback}`);
}
if (!existsSync('dist/pagefind/pagefind.js')) throw Error('Search index missing');
for (const path of ['dist/index.html', 'dist/architecture/index.html']) {
  if (!read(path).querySelector('[data-pagefind-ignore="all"]')) throw Error(`Marketing page enters docs search: ${path}`);
}
console.log('Built docs redirect, routes, links, anchors, canonicals, search metadata and preview indexing verified');

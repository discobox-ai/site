import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { checkBlogBuild } from './check-blog-build.mjs';
import { DOMParser } from 'linkedom';

test('publication rules agree across routes, listing, sitemap and RSS', () => {
  const fixtures = [
    ['published', '2000-01-01', false],
    ['draft', '2000-01-01', true],
    ['future', '2999-01-01', false],
  ];
  const created = [];
  const build = () => execFileSync('pnpm', ['exec', 'astro', 'build'], { stdio: 'pipe', env: { ...process.env, SITE_PREVIEW: 'true' } });
  try {
    for (const [name, date, draft] of fixtures) {
      const path = `src/content/blog/test-${name}-source.md`;
      assert.equal(existsSync(path), false, `fixture already exists: ${path}`);
      created.push(path);
      writeFileSync(path, `---\ntitle: Test ${name}\ndescription: Fixture & description\nauthor: Test author\nslug: test-${name}\npublished: ${date}\ndraft: ${draft}\n---\n\n## Fixture body\n\n[Docs](/docs/)\n`);
    }
    build();
    checkBlogBuild();
    const listing = readFileSync('dist/blog/index.html', 'utf8');
    const feed = readFileSync('dist/blog/rss.xml', 'utf8');
    const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
    const xml = new DOMParser().parseFromString(feed, 'text/xml');
    assert.equal(xml.querySelectorAll('parsererror').length, 0);
    const item = [...xml.querySelectorAll('item')].find(item => item.querySelector('title').textContent === 'Test published');
    assert.ok(item);
    assert.equal(item.querySelector('link').textContent, 'https://discobox.ai/blog/test-published/');
    assert.equal(item.querySelector('description').textContent, 'Fixture & description');
    for (const [name] of fixtures) {
      const included = name === 'published';
      assert.equal(existsSync(`dist/blog/test-${name}/index.html`), included);
      for (const output of [listing, feed, sitemap]) assert.equal(output.includes(`/blog/test-${name}/`), included);
    }
    const post = readFileSync('dist/blog/test-published/index.html', 'utf8');
    assert.ok(post.includes('/edit/preview/src/content/blog/test-published-source.md'));
    for (const html of [listing, post]) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      assert.equal(doc.querySelector('link[rel="alternate"]').getAttribute('href'), 'https://discobox.ai/blog/rss.xml');
      assert.equal(doc.querySelector('meta[name="robots"]').getAttribute('content'), 'noindex, nofollow');
      assert.ok(doc.querySelector('link[rel="canonical"]').getAttribute('href').startsWith('https://discobox.ai/blog/'));
    }
    const postPath = 'dist/blog/test-published/index.html';
    writeFileSync(postPath, post.replaceAll('href="/docs/"', 'href="/does-not-exist/"'));
    assert.throws(checkBlogBuild, /Broken blog link/);
    writeFileSync(postPath, post.replaceAll('href="/docs/"', 'href="/docs/#missing-anchor"'));
    assert.throws(checkBlogBuild, /Broken blog anchor/);
    writeFileSync(postPath, post);
    const duplicate = 'src/content/blog/test-duplicate.md';
    assert.equal(existsSync(duplicate), false);
    created.push(duplicate);
    writeFileSync(duplicate, readFileSync('src/content/blog/test-published-source.md', 'utf8'));
    assert.throws(build, error => String(error.stdout).includes('Duplicate blog slug') || String(error.stderr).includes('Duplicate blog slug'));
  } finally {
    for (const path of created) rmSync(path, { force: true });
  }
});

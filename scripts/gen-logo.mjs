// Syncs the brand art and the TUI mark's cell data in from the discobox
// repository.
//
// The files this writes are committed here, so the site builds and deploys on
// its own. This script is how they are refreshed when the brand art or the
// mark changes upstream, and it needs a discobox checkout to do it: set
// DISCOBOX_REPO, or keep one beside this repository.
//
// Run: pnpm gen:logo

import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, '..');

// Where the source art lives. An explicit path wins; otherwise the usual
// places a checkout sits next to this one.
const candidates = process.env.DISCOBOX_REPO
  ? [resolve(process.env.DISCOBOX_REPO)]
  : [resolve(siteRoot, '../discobox'), resolve(siteRoot, '../disco2')];

const repo = candidates.find((path) => existsSync(resolve(path, 'assets/brand')));
if (!repo) {
  console.error(
    'Could not find a discobox checkout. Set DISCOBOX_REPO to one, or clone it\n' +
      'beside this repository. Looked in:\n' +
      candidates.map((path) => `  ${path}`).join('\n'),
  );
  process.exit(1);
}

// assets/brand is the source of truth: the mark and wordmark came out of
// Illustrator, and every rendered form derives from one of them. The mark's
// cell data is generated in that repository by scripts/logo-cells.mjs — run
// `go tool task logo:cells` there first if the mark itself changed.
const copies = [
  ['assets/brand/logo-purple.svg', 'src/assets/logo.svg'],
  ['assets/brand/wordmark-gradient.svg', 'src/assets/wordmark-gradient.svg'],
  ['assets/brand/wordmark-white.svg', 'src/assets/wordmark-white.svg'],
  ['assets/brand/favicon.svg', 'public/favicon.svg'],
  // Cell data, not an image, so it stays out of Astro's image pipeline.
  ['cli/internal/tui/logo.json', 'src/data/logo.json'],
];

console.log(`syncing from ${repo}`);
for (const [from, to] of copies) {
  const source = resolve(repo, from);
  if (!existsSync(source)) {
    console.error(`missing upstream file: ${source}`);
    process.exit(1);
  }
  copyFileSync(source, resolve(siteRoot, to));
  console.log(`  ${from} -> ${to}`);
}

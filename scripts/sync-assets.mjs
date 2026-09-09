// Syncs the brand art, the TUI mark's cell data, and the application
// screenshots in from the discobox repository.
//
// The files this writes are committed here, so the site builds and deploys on
// its own. This script is how they are refreshed when any of them changes
// upstream, and it needs a discobox checkout to do it: set DISCOBOX_REPO, or
// keep one beside this repository.
//
// Run: pnpm sync:assets

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

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
  // Screenshots of the running launcher, captured upstream from a real run
  // rather than mocked up — assets/screens/README.md there says how to retake
  // one. Only the shots the site actually places are copied, and they are
  // trimmed on the way in: see below.
  ['assets/screens/launcher.png', 'src/assets/screens/launcher.png', 'trim'],
  ['assets/screens/claude-code.png', 'src/assets/screens/claude-code.png', 'trim'],
];

// The capture script upstream frames each shot in flat background — its own
// 28px border, plus whatever padding the terminal window carries — which the
// site would otherwise draw as a second frame around the one in the picture.
// Trimming it here rather than cropping in CSS means the amount is measured
// from the file every time it is synced, instead of being a constant this
// repository would have to re-measure whenever a shot is retaken. The trim
// stops at the first pixel that is not that background, which is the mark's
// own border.
async function trimBorder(source, destination) {
  const before = await sharp(source).metadata();
  await sharp(source).trim({ threshold: 12 }).toFile(destination);
  const after = await sharp(destination).metadata();
  return `${before.width}x${before.height} -> ${after.width}x${after.height}`;
}

console.log(`syncing from ${repo}`);
for (const [from, to, mode] of copies) {
  const source = resolve(repo, from);
  if (!existsSync(source)) {
    console.error(`missing upstream file: ${source}`);
    process.exit(1);
  }
  const destination = resolve(siteRoot, to);
  // Only these two land in a directory that exists solely because of them, but
  // a missing parent is a raw ENOENT out of node either way, and this script
  // reports everything else it can fail on in a sentence.
  mkdirSync(dirname(destination), { recursive: true });
  if (mode === 'trim') {
    console.log(`  ${from} -> ${to}  (trimmed ${await trimBorder(source, destination)})`);
    continue;
  }
  copyFileSync(source, destination);
  console.log(`  ${from} -> ${to}`);
}

---
name: verify-recipes
description: Exercise the built Astro marketing site, versioned docs and Pagefind search in Chromium.
---

Build with `SITE_PREVIEW=true pnpm build`, then run `pnpm preview --host
127.0.0.1 --port 4322`. Read the reported URL: Astro can choose another port
if the requested one is occupied. Stop it with `pnpm exec astro preview stop`.

Drive the built site in Chromium (system binary `/usr/bin/chromium`, headless
with `--no-sandbox` in this container). Use Playwright from a temporary npm
prefix if none is installed. Search indexes exist only in production builds.

Check `/docs/`, version landing, all manual links, provenance, upstream edit
links, keyboard search (Ctrl-K, Escape), selected-version search and all-version
search. Confirm results are docs only and include version labels. Run
`pnpm test:docs-header` (set `CHROMIUM=/usr/bin/chromium` here) for the
phone-width header. Resize to 390px and use the sidebar menu to reach console and CLI pages. Exercise the
version selector; use temporary second-version fixtures when checking the
preserve-page/fallback behavior, then remove them and rebuild. Confirm home
and architecture still render, production canonical URLs and preview noindex.
For installer behavior, serve the built assets through Wrangler and send curl
requests to `/`, `/install.sh`, `/install.ps1` and browser requests to docs.
No external deploy should be attempted from a fork PR.

For blog changes, add temporary published, draft and future Markdown posts,
build, and drive `/blog/` to the published post in Chromium. Check feed
discovery and RSS items, production canonicals, preview noindex, rendered
Markdown and mobile navigation at 390px. Direct draft/future URLs must be
404 and absent from listing, feed, sitemap and docs search. Remove the
fixtures and rebuild before committing. `pnpm test:blog` supplies build-level
publication regression coverage; browser observation is still required.

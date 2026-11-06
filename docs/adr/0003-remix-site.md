# ADR 0003: Complete site on Remix 3

- Status: Proposed
- Date: 2026-11-06
- Scope: [site #16](https://github.com/discobox-ai/site/issues/16)
- Amends: [ADR 0001](0001-docs-and-blog.md), framework, rendering, search integration,
  RSS generation and build/deployment decisions only

## Context

The owner requested a complete Remix 3 rewrite following
[repostd](https://github.com/discobox-ai/repostd), separately from #15's
interim conformance work. This is a framework migration, not a redesign or a
change to who owns content. Preserve ADR 0001's source ownership, provenance,
release versioning and publication contracts.

The inspected `preview` head is
`e5767de71cc8fe89ef697abd17ef07f6280566d3`. It is evidence, not the source
revision to freeze for implementation. The implementation worker must fetch
then-current `preview`, record its SHA, and inventory changes merged since
this inspection, including #15 and any docs/blog work. Reconcile that
inventory again before cutover. ADR 0002 remains Proposed at this baseline;
this proposal does not accept it or add `/docs/main/`. If its implementation
lands before migration, include its actual contracts in parity coverage.

| Current surface | Evidence and contracts to carry forward |
| --- | --- |
| Marketing | `src/pages/index.astro`, `architecture.astro`, `src/components/`, `src/layouts/BaseLayout.astro`: section links, navigation, metadata, responsive layout, terminal mark and install command interactions. |
| Documentation | `astro.config.mjs`, `src/content.config.ts`, `src/components/docs/`, `src/pages/docs/index.astro`: Starlight layout/sidebar/theme, Pagefind, version picker, source notices and edit links. `src/data/docs-versions.json` currently has only prerelease v0.19, no tag and `currentStable: null`; `/docs/` renders a chooser. |
| Content provenance | `scripts/import-docs.mjs`, committed docs and `public/docs-attribution/`: explicit public-file mappings, source/output hashes, full SHA/tag, generator identity, link rewriting, license and notice; ordinary builds require no upstream checkout or fetch. |
| Blog | `src/content.config.ts`, `src/lib/blog.ts`, `src/pages/blog/`, `src/layouts/BlogLayout.astro`: path-based source identity, validated metadata, unique stable slugs, UTC dates, one publication rule for pages/list/feed, draft/future exclusion, RSS discovery. |
| Assets | `scripts/sync-assets.mjs`, `src/assets/`, `src/data/logo.json`, `public/favicon.svg`: upstream-authored art, trimmed screenshots, responsive image output, external SVG wordmarks with explicit aspect ratios. |
| Delivery | `wrangler.jsonc`, `worker/index.ts`, `public/_redirects`, `.github/workflows/ci.yml`: static `dist/`, installer interception, `/security` 301, two deployment targets, production canonicals and preview noindex. |

## Decision

### One Remix application

Replace Astro and Starlight throughout the site with Remix 3. Follow repostd's
project structure and conventions rather than adapting a React Router or
Remix 2 starter. Marketing and docs/blog layouts become Remix UI components;
there is no retained Astro renderer, parallel docs service or runtime CMS.
Use root `server.ts`; `app/routes.ts` declares the route map and
`app/router.ts` composes it with `app/middleware/`. Controllers and route
actions live in `app/actions/`, shared views in `app/ui/`, and asset
declarations in `app/assets.ts`. Browser source lives in `public/` directories
beside its narrowest owner. Compiled content has its own `app/content/` module.
Shared navigation and brand tokens remain shared, with docs reading styles
scoped to avoid marketing CSS leakage. Preserve light/dark docs themes,
mobile sidebar, table of contents, heading anchors, code blocks, accessible
skip/navigation controls and keyboard operation.

Declare the public route contract explicitly: `/`, `/architecture`, `/docs/`,
`/docs/<line>/`, `/docs/<line>/<slug>/`, `/blog/`, `/blog/<slug>/`,
`/blog/rss.xml`, sitemap and static assets, plus the installer paths and
legacy redirect. Match only manifest-listed docs and published blog slugs;
unknown paths are real 404s, not homepage fallbacks. Preserve existing slash
normalization, redirects, query handling, anchor IDs and public asset URLs
where referenced externally. Do not slugify periods out of `v0.19`.

### Build-time content and rendering

Compile committed Markdown during the build into validated page data and
HTML using one Markdown pipeline for live rendering and search generation.
Use explicit frontmatter schemas independent of Astro. Preserve the current
heading ID/link rewriting behavior; compare headings, links and code output
against the baseline before replacing its renderer. No request-time Markdown
compilation or product fetch is needed. Imported content stays inert data,
not executable MDX or application code.

Keep the importer and manifest contracts. Prefer leaving snapshot bytes and
paths unchanged; if presentation frontmatter or paths must change, update the
importer and output hashes together, retain upstream source hashes/SHA/tag,
and demonstrate a fresh import round trip. Product manuals, CLI generation,
licenses and upstream edit links remain tied to the exact imported revision.
Normal builds validate these committed inputs without running upstream code.

Render HTML through the Remix application at request time from the compiled
content catalogue. Build-generated RSS, sitemap, search index and immutable
assets are static outputs. Choose a single build timestamp for blog inclusion:
`draft === false` and `published <= buildTime`, ordered as today. That same
catalogue drives route existence, listing, RSS, sitemap and search exclusion;
a later request must not publish a future post without a new build. Reject
duplicate slugs even among excluded posts, retain stable permalinks and
source identities, validate updated dates, and keep RSS production URLs and
feed discovery. Do not bundle excluded post bodies into publicly served
client assets or search data.

All HTML, including 404s, uses the preview indexing policy. Canonical and
Open Graph URLs, RSS and sitemap use `https://discobox.ai` regardless of
request host. Preview builds set `SITE_PREVIEW=true`; retain noindex/nofollow
in HTML and add a response indexing header as defense in depth. The edge
mirror retains the production canonical identity. Generate sitemap entries
from the published route catalogue, including the currently exposed sitemap
URLs; exclude unpublished posts.

### Documentation navigation and search

Build the sidebar, release banner, provenance links and version picker from
`src/data/docs-versions.json`. With `currentStable: null`, `/docs/` stays a
chooser; once a tagged stable entry is explicitly selected, preserve the
existing stable redirect contract. Do not substitute `defaultVersion` or a
live release lookup for stable selection. Preserve page slugs when switching
versions and fall back to the target landing page for a missing page. Display
release status, exact version and pinned SHA, including the warning when no
published installer tag matches the source snapshot.

Retain Pagefind, invoked directly as a pinned build dependency rather than
through Starlight. Render a temporary HTML corpus from the same docs page
renderer and manifest, attach the existing version metadata, run Pagefind,
and publish only its generated index under `/pagefind/`. Explicitly map each
corpus document to its public docs URL; temporary corpus files are not
public routes or deploy assets. This avoids crawling a deployed site or
assuming runtime HTML exists as files in the build output. The build fails
if any published docs page is missing from the index or a non-docs page is
included.

Port the search dialog to Remix UI: lazy-load the bundled Pagefind browser
module, default to the selected release line, offer explicit all-versions
scope and label every result with its version. All-versions filtering uses
Pagefind's `any` semantics, not an AND array. Preserve Ctrl/Cmd-K, Escape,
focus restoration, query labels, loading/error announcements and protection
against stale asynchronous results. Verify with two version fixtures. Search
has no external service, account or runtime database.

### Cloudflare and installer precedence

Keep the existing Worker names, domains and Workers Builds integration.
Target the Cloudflare Workers runtime with a thin request adapter to Remix's
standard request handler. Produce the application bundle and public assets
under `build/`; Wrangler's entry and asset directory must point to their
actual separate outputs. Do not rename `dist/` merely to satisfy a checker.
No Node server process is required on Cloudflare; the standard development
entry must exercise the same router and middleware contracts.

Run the Worker first for application paths so static index files or asset
fallbacks cannot bypass negotiation, redirects or preview headers. Its
ordered dispatch is: installer handling; explicit legacy redirects;
registered static assets; Remix routes; 404. Preserve asset cache semantics,
MIME types and GET/HEAD behavior. Serve assets through the binding without
recursing into the application. Implement `/security` → `/architecture` as
an explicit 301 in middleware, including its existing query behavior, since
`_redirects` must not be assumed to apply when the Worker handles a request.

Port the installer logic from `worker/index.ts` into a dedicated middleware
module with behavioral tests. Preserve its actual dispatch: explicit
`/install.sh` and `/install.ps1`; on `/`, PowerShell first, then curl/wget;
**edge-host `/` returns a shell installer even to a browser**. Other browser
roots render the homepage. Only GET/HEAD use installer handling; preserve
other methods' observed fallback responses. Keep stable/edge selection,
stable winning equal core versions, mirror then GitHub fallback, redirect/tag
extraction, `x-discobox-release`, text/plain, 300-second success caching,
HEAD body suppression, and executable shell/PowerShell 502 failures with
no-store. Never HTML-cache a negotiated installer response. Test with stubbed
upstream responses as well as a live smoke request without executing scripts.

Cloudflare dashboard settings are external state, not verified by this ADR.
Before merging the implementation, record the existing main/preview build
and deploy commands, Node/pnpm pins and environment variables, then prepare
the matching new settings. Apply preview settings with the preview cutover;
leave production compatible with its existing revision until the owner
promotes the release. Fork CI gets no deployment authority or secrets.

## Alternatives rejected

| Alternative | Reason to reject |
| --- | --- |
| Keep Astro/Starlight or migrate marketing only | Does not meet the owner's complete Remix rewrite request; retains two renderers and the temporary #15 exceptions. |
| Use React Router/Remix 2 because adapters are familiar | Does not meet Remix 3/repostd requirements; similarly named APIs are not evidence of compatibility. |
| Prerender the entire site and keep the current assets-only architecture | Recreates the temporary static-site exception and adds a separate route/export system. Runtime Remix rendering keeps routing in one application; the small content set remains compiled at build time. |
| Replace Pagefind with hosted or server search | Adds service/data ownership without a new search requirement. Standalone Pagefind preserves current client behavior and deployment independence. |
| Fetch content or decide publication at request time | Loses reproducible snapshots and changes future-post publication semantics. |
| Big-bang production cutover or automatic preview promotion | Violates the owner's release policy and removes the preview parity gate. |

## Migration, verification and rollback

1. Record the then-current preview SHA and a behavior inventory: routes/statuses,
   redirects, headers, metadata, sitemap/RSS, docs anchors, content hashes,
   screenshots at desktop and 390px, search scopes and installer request matrix.
   Carry forward any newer merged work. This baseline is the parity oracle;
   intentional changes require separate explicit review.
2. Implement on a branch targeting `preview`. Keep one deployment artifact;
   remove Astro/Starlight dependencies, config, components and `dist/` checks
   once their replacements cover every route. Update README, design notes,
   verification recipes, build scripts, lockfile and CI together. Preserve
   upstream-owned brand bytes and sync behavior; replace Astro image transforms
   with build-time image generation preserving dimensions, quality and layout.
3. Port the assertions in `scripts/check-docs-build.mjs`,
   `scripts/check-blog-build.mjs`, `scripts/blog-build.test.mjs` and
   `scripts/docs-check.test.mjs`; check generated artifacts where appropriate
   and HTTP responses for runtime-rendered pages. CI must type-check, validate
   imports/content, build both indexing modes, validate the search index, run
   behavioral tests and pass repostd's strict checker. A checker alone does
   not establish architectural or runtime conformance.
4. Exercise the production bundle in Wrangler and Chromium using the updated
   verification recipe: marketing interactions/navigation; docs provenance,
   anchors, mobile/sidebar/theme and keyboard controls; stable-null and tagged
   stable fixtures; two-version picker preserve/fallback and scoped search;
   published/draft/future/duplicate blog fixtures, direct excluded-page 404s,
   valid XML/discovery/sitemap; canonical URLs and preview noindex across HTML;
   installer hosts/UAs/methods, fallback/error paths, assets and real redirects.
   Check unknown routes and content types. Do not rely only on dev-server output.
5. After human merge, verify deployed `preview.discobox.ai` against that matrix
   and record the deployed SHA. The owner promotes to `main` only at release;
   align production build settings then and verify production/edge host behavior.
   No worker pushes or merges either base branch as part of this proposal.

Before preview cutover, retain its last working commit and deployment ID plus
external build settings. Roll back by restoring that deployment and its
matching settings, or reverting the complete migration on preview. The old
Astro revision must remain buildable with its old commands; a source revert
alone is insufficient after dashboard changes. Keep production on its prior
deployment until promotion passes; if promotion fails, restore its prior
artifact and settings without touching imported upstream content. Later
snapshot refreshes remain separately revertible import commits.

## Consequences

The site gains one Remix routing/rendering architecture and keeps independent,
reviewable content snapshots. Maintainers now own the docs reading UI and
standalone search indexing that Starlight supplied, plus a Worker adapter and
runtime HTML rendering. That increases maintenance and runtime work relative
to the static baseline; page data remains local and there is no new backend.

Exact dependency versions, Markdown plugins, module/file names beyond repostd's
required structure, cache policy for rendered HTML, image encoding settings,
and the adapter's concrete API calls remain implementation choices. Pin and
prove compatible Remix 3, Pagefind, Markdown and Wrangler versions with the
installed Remix project tour and a minimal Worker build before porting all
pages. Demonstrate docs indexing from the temporary corpus and browser loading
of its published index. If Remix 3 cannot run on Workers while satisfying
repostd, return with a concrete amendment; do not silently downgrade Remix,
change hosting, or retain Astro.

This ADR adds no implementation, dependencies, deployment settings or content
changes. Owner merge accepts the proposal; the implementation PR records
acceptance. ADR 0001's unaffected content and release contracts remain in force.

## References

- [repostd standard at 03b594f](https://github.com/discobox-ai/repostd/blob/03b594feef8f250c4ba27a5457719067a3d336e8/internal/canon/files/managed/common/.agents/skills/repostd/SKILL.md.tmpl):
  node layout (§1), tooling (§4), tests (§7), CI (§8). Carry forward #15's
  conformance changes and remove the Astro/static-output exceptions. The
  implementation uses pinned Node/pnpm, oxlint/oxfmt/typecheck and
  `remix doctor --strict`, standard scripts and managed CI actions, with no
  deployment permission in fork checks. Re-read the then-current standard.
- [Remix project tour](https://guides.remix.run/start-here/) and
  [request handling](https://docs.remix.run/request-handling/): the application
  router uses Web Request/Response; runtime entries delegate to its fetch handler.
- [Pagefind Node API](https://pagefind.app/docs/node-api/) and
  [browser API](https://pagefind.app/docs/api/): build an index independently
  of Starlight and consume the generated browser bundle. Confirm the chosen
  pinned release supports the corpus URL mapping before migration.

This record uses the current site's four-digit scheme from `docs/adr/README.md`.
Repostd now specifies date/random IDs for new records; repository-wide ADR
format/index conformance remains #15's work. If that process lands before
this proposal, allocate its ID under the adopted process before merge rather
than renumber accepted records.

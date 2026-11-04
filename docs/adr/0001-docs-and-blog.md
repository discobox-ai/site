# ADR 0001: Docs and blog on discobox.ai

- Status: Proposed
- Date: 2026-11-04
- Scope: [site #2](https://github.com/discobox-ai/site/issues/2) and
  [site #3](https://github.com/discobox-ai/site/issues/3), for v0.19

## Context

The site is an Astro static build (`package.json`, `astro.config.mjs`). At
`ff174f543e9db8e997fd52aabe735a2884b6276e`, `src/pages/` contains the home and
architecture pages, with no docs or blog collection. Cloudflare Workers
serves `dist/`; only `/`, `/install.sh`, and `/install.ps1` run the installer
Worker (`wrangler.jsonc`, `worker/index.ts`). The same static site is also
served on `edge.discobox.ai`. `preview.discobox.ai` is a branch deployment.

`.github/workflows/ci.yml` checks and builds PRs. `deploy.yml` checks, builds,
and deploys `main` and `preview`. Builds currently need no product checkout;
brand assets are committed copies synced explicitly from discobox
(`README.md`, `scripts/sync-assets.mjs`). There is no ADR directory, index,
or numbering process in this repository; this record starts a four-digit
sequence local to site, independent of discobox's ADRs.

Issue #2 reports that product documentation lives in discobox-ai/discobox's
`docs/` and READMEs. Its exact inventory and generation tooling were not
verified here: this box's GitHub role cannot read that repository. This
proposal does not assume an existing export command or prescribe upstream
file names. Implementation must inventory those sources before migration.

The decisions must provide release-specific instructions, a CLI/TUI
reference that follows the product, and a low-friction reviewed blog. The
v0.19 deadline favors reusing the existing delivery path and avoiding a
second website service.

## Options

| Option | Benefits | Costs and reasons to pass over it |
| --- | --- | --- |
| **Starlight docs plus native Astro blog in this site (recommended)** | Reuses Astro, domains, styles, and Cloudflare deployment; docs navigation and static search come from Starlight; blog remains a small content collection. | Version selection and release imports need explicit site code; integration with this repo's Astro version must be checked. |
| Custom Astro docs and blog | One stack and complete layout control; no docs framework integration. | We would build and maintain docs navigation, table of contents, search UI, accessibility, and version selection ourselves. That is unnecessary work for v0.19. |
| Docusaurus for docs and blog, alongside or replacing Astro | Docs version snapshots and a blog are established framework features. | A separate build adds routing and deployment seams; replacing Astro rewrites the marketing site. Prefer this if versioning requirements grow beyond the modest scheme below. |
| Separate Starlight site at docs.discobox.ai, Astro blog here | Independent docs dependencies and releases; a useful fallback if integration is incompatible. | Additional build/deploy configuration and cross-site navigation without a present need for independent ownership. |
| Hosted docs/CMS and hosted blog | Editorial tooling and managed publishing can reduce custom work. | Adds service ownership, cost, and a separate publishing workflow. There is no requirement for non-Git authors, accounts, or a CMS in these issues. |

This recommendation is a proposed choice for owner acceptance, not an
assertion that Starlight has already been integrated or benchmarked.

## Proposed decision

### Stack, placement, and hosting

Keep one repository, static build, and Cloudflare deployment. Add Starlight
for documentation routes under `https://discobox.ai/docs/`; build the blog
with Astro content collections and Astro page layouts under
`https://discobox.ai/blog/`. Use Markdown by default and MDX only when a page
needs a component. Do not add a third-party blog plugin or a runtime CMS.

Put the `docs/` prefix in documentation content IDs/routes; do not set the
whole Astro site's base to `/docs`. Keep the home and architecture routes
as ordinary Astro pages. Share brand tokens and navigation links while
allowing Starlight to own the docs reading layout. Scope marketing CSS so it
does not accidentally restyle docs. Build everything into the existing
`dist/` and serve it through the existing static asset configuration.

Use discobox.ai as the canonical origin, including canonical links, sitemap,
and RSS URLs. The existing edge mirror must not produce a second canonical
identity. Preview builds must be excluded from indexing and use production
canonical URLs. No new DNS, Worker service, or request-time content fetch is
required. Installer content negotiation remains confined to its current paths.

### Source ownership and imports

Keep product instructions and reference material authoritative in
**discobox-ai/discobox**, alongside the code they describe. Keep site layouts,
navigation, blog posts, and presentation metadata authoritative in **site**.
Do not independently author a second CLI reference here.

Publish committed documentation snapshots into site's docs collection with
an explicit import process, analogous to the existing asset sync. A committed
manifest records each snapshot's product tag, full commit SHA, imported file
mapping, and generator version/command where applicable. Normal site builds
read only committed inputs; they never fetch a moving upstream branch or
execute upstream code during a fork PR build.

The import must select public user documentation explicitly, rewrite relative
links/assets, preserve attribution where required, and fail on missing input
or unresolved internal links. Do not publish the upstream `docs/` tree
wholesale: design records and internal instructions are not automatically
public product docs. Imported pages link their edit action to their upstream
source; presentation and blog edit actions point to site.

Generate the CLI command/flag reference from the command definitions at the
same pinned revision. Author TUI keybindings, workflows, concepts, and
getting-started guidance upstream and review them against that release's
actual UI. Generated help is not a substitute for TUI documentation or
observed behavior. If the product lacks an exporter, add one in product
implementation work; do not pretend the generator exists today.

A product change that alters commands, defaults, or TUI behavior must update
its documentation in the same product PR. The release checklist requires a
reviewed site import PR before promoting that release's docs as current.
A maintainer may run the import locally for v0.19; automatic cross-repository
PR creation is deferred. Future automation must use narrowly scoped access
and still produce a reviewed PR, rather than push directly to site main.

### Release versioning and URLs

Publish a complete snapshot per minor release line, starting at
`/docs/v0.19/`, with getting-started, CLI reference, TUI reference, and
concepts. Each page displays the release line and the exact product version
from its manifest. Patch releases refresh that line's snapshot through an
import PR; retain provenance in Git. This provides per-release provenance
without duplicating the entire manual for every patch.

`/docs/` redirects to the current stable line's landing page, initially
`/docs/v0.19/` once v0.19 is released. A committed versions manifest controls
the current line and the version picker; do not infer it from a live release
API. Prerelease docs must be labeled as such and must not silently become
the stable target. There is no unversioned duplicate manual or `/next/`
manual in the initial scope.

Keep previous published minor lines addressable and label their support
status explicitly; retaining a snapshot does not promise product support.
A picker preserves the page when it exists in the target version and falls
back to that version's landing page when it does not. Corrections to old
snapshots require reviewed imports from an identified source revision. Do
not silently regenerate old versions from current product main.

### Search

Use Starlight's built-in Pagefind integration: a static index shipped with
the site, without a hosted search account or runtime backend. Index published
docs; exclude draft content and the marketing/blog routes from the docs
index. Filter results to the selected release line by default and offer an
explicit all-versions choice, showing the version on each result. Version
filtering and the picker are implementation work, not assumed Starlight
version-management features. Test search on the production build because its
index is generated at build time.

### Blog and RSS

Author posts in site's own blog collection, reviewed through normal PRs.
Validate title, description, publication date, author, stable slug, and an
optional updated date; represent draft status explicitly. Omit drafts and
future-dated posts from production pages, listings, sitemap, and RSS. A future
date alone does not schedule a deployment: publishing requires a build from
main at or after that date.

Use `/blog/<slug>/` permalinks without dates in the path. Generate
`/blog/rss.xml` with `@astrojs/rss`, using absolute production URLs, stable
item links, publication dates, descriptions, and the same inclusion rule as
the listing. Expose feed discovery in the blog layout. No comments, accounts,
or separate blog search service are required for v0.19.

The first post announces v0.19, links to its release and versioned docs,
and describes verified shipped changes and how to get started. Draft it in
an implementation PR; publish only when the release and docs links resolve.
Do not put internal ADR references into release prose.

### Delivery and acceptance

Extend the existing PR checks to validate content schemas, internal links,
version metadata, generated reference consistency, RSS, and a production
build including the search index. Main remains the only production publishing
branch; preview remains the existing preview branch, with the same content
validation. Content changes use PRs just like code.

Before considering #2 and #3 delivered, exercise the built site and observe:

- `/docs/` resolves to v0.19; getting-started instructions work with the pinned
  CLI, and CLI/TUI reference agrees with that release.
- Direct versioned links, mobile navigation, keyboard navigation, version
  switching (including missing pages), and version-filtered search work.
- `/blog/`, the release post, RSS discovery, and valid feed items work; drafts
  are absent from every public output.
- Canonical URLs stay on discobox.ai, preview is not indexed, and the home,
  architecture, and installer paths keep working.
- A main deployment contains both docs and blog from the checked commit;
  reverting a site commit can restore a prior snapshot without upstream fetches.

## Consequences and implementation gates

The site can build reproducibly and docs changes can be reviewed independently
of deployment. Product authors keep responsibility for product accuracy;
site maintainers own imports, presentation, version promotion, and publishing.
The cost is coordination between two repositories and some small, explicit
version/search UI code. Documentation publication can lag a product release
unless the release checklist is followed.

Before adding dependencies, verify a supported Starlight/Astro combination
against this repo's Astro `^7.2.4`, Node, and pnpm pins and prove docs routes
can coexist with the marketing pages. This ADR does not prescribe a package
version or authorize a framework downgrade. If compatibility requires a
separate build or a different framework, return with an amendment to this
proposal rather than silently changing the chosen architecture.

Other implementation details remain open: upstream public-file inventory,
exporter interface, import manifest schema and script names, exact sidebar
structure, visual design, and the first post's text. They must satisfy the
ownership, versioning, URL, and publication contracts above. This record adds
no exporter, content migration, dependencies, routes, automation, or release
post. It remains **Proposed** until accepted by the owner.

## References

- [Starlight manual setup](https://starlight.astro.build/manual-setup/): integration into an existing Astro project.
- [Starlight content authoring](https://starlight.astro.build/guides/authoring-content/): Markdown and MDX support.
- [Starlight search](https://starlight.astro.build/guides/site-search/): built-in Pagefind and production indexing.
- [Astro RSS recipe](https://docs.astro.build/en/recipes/rss/): feeds from content collections.
- [Docusaurus versioning](https://docusaurus.io/docs/versioning/): snapshot-based documentation versions and their maintenance cost.

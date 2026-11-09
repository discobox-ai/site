# Public documentation

ADR 0001 governs docs ownership and publishing. Site layouts and presentation
live here; public manuals and command definitions live in discobox. The blog
is separate work (#3).

`src/data/docs-versions.json` pins each minor line to a full upstream commit,
records an explicit public-file mapping, content hashes, exporter identity,
release status and optional exact tag. A main snapshot has `tag: null` and
must stay prerelease. `currentStable` names the line `/docs/` redirects to,
and only a line imported at a stable release tag may hold it. The redirect is
a real HTTP 302: the build appends `/docs` and `/docs/` rules for it to the
`_redirects` copied from `public/` (`src/integrations/docs-redirect.mjs`), and
Workers static assets serves them before any page. A static build can only
write `Astro.redirect` as a page with a two-second meta refresh, so that page
stays as the fallback. The build check fails unless both point at
`currentStable`, or, with no stable line, neither exists. With no stable line, `/docs/` shows the default line's pages
instead, labelled with its status, rather than redirecting readers to a
supposed stable release. A patch release is a new import of its line: set the
new commit, tag and version, re-run `pnpm import:docs`, and commit the pages,
edit links and hashes it rewrites. Nothing checks that the pages came from the
manifest's commit, so changing those fields alone would put old pages under
the new version. A patch keeps the line's status and URLs.

`pnpm import:docs CHECKOUT v0.19` checks the checkout revision/cleanliness,
runs upstream `go tool task docs:check`, copies only the allowlisted pages,
rewrites relative manual links, and copies the Apache license and notice.
It never imports ADRs. Missing sources and unresolved relative links/assets
fail. New assets must be deliberately added to the importer; the current
manual contains none. Imports rewrite links and add presentation frontmatter;
they do not author or alter product instructions. Re-run the upstream
`docs:generate` task before committing product command changes.

Normal builds do not use a product checkout or network. They validate hashes
and version metadata, then check built manual routes, internal links and
anchors, canonical URLs, version filters, search output and preview noindex.
The snapshot is restored by reverting its import commit. New minor versions
add entries, preserving previously published minor URLs and support labels.

Content IDs explicitly preserve periods: Starlight's default slugification
would change `/docs/v0.19/` to `/docs/v019/`. The picker preserves the current
slug when its target snapshot maps it, otherwise it uses the target landing
page. Search uses the bundled Pagefind index, filtering by release line by
default; “all versions” supplies all published lines. Each result labels its
version. Marketing pages opt out of the index.

Starlight owns docs CSS; marketing CSS is imported only by BaseLayout.
Both import `src/styles/brand.css`; docs maps its palette and fonts to
Starlight tokens for both themes without importing marketing element styles.
Canonical links always use discobox.ai. The preview deployment sets
`SITE_PREVIEW=true` to exclude all HTML from indexing. CI builds with this
flag too. Main and preview use the existing Worker static-assets deployment;
installer routing is unchanged. No production deployment is possible from a
fork PR. After a human merges into preview, exercise its deployed URLs before
promotion to main; this worker never pushes either base branch.

The native Astro blog uses its own Markdown collection. `publishedPosts()`
is the shared inclusion rule for static post paths, the listing and RSS:
explicit drafts and future dates never produce public output, even in preview.
The schema requires editorial metadata and a stable URL slug; duplicate slugs
fail the build. RSS uses the production origin and the same stable permalinks.
BlogLayout exposes RSS discovery and inherits production canonical URLs,
preview noindex and exclusion from the docs search index from BaseLayout.
Starlight generates the site sitemap from built routes; excluded posts have
no routes to expose. Authoring and release promotion are described in README.

# Site design

The site is an Astro static build serving marketing pages, Starlight manuals
and an Astro content-collection blog. [Documentation design](docs/DESIGN.md)
covers imported snapshots, provenance, version selection and publication.
[Docs UI design](src/components/docs/DESIGN.md) covers presentation and search.

Cloudflare Workers Builds builds `main` for production and `preview` for the
preview host. The owner promotes preview only at release time. GitHub Actions
validates PRs and pushes; it holds no deployment credentials.

`wrangler.jsonc` serves static output from `dist/`. `worker/index.ts` handles
installer content negotiation only on `/`, `/install.sh` and `/install.ps1`,
fetching release scripts from the asset mirror. Other routes serve static
assets. Preview builds use `SITE_PREVIEW=true` and production canonical URLs.

Brand art, screenshots and imported public manuals are committed inputs from
the product repository. Ordinary builds never fetch product source. Explicit
import scripts validate pinned provenance; formatters ignore generated inputs.

`package.json` owns the commands used by local hooks and CI. Node and pnpm are
pinned there; the managed actions install them. `verify` detects formatting or
generation changes, `check` runs lint and diagnostics, `test` runs Node tests,
and `build` validates docs/blog output and emits the search index.

## Repository standard exceptions

The owner approved retaining Astro/Starlight instead of repostd's Remix 3 UI
layout and retaining `dist/` instead of `build/` on 2026-11-06 for #15. These
preserve the current site and Cloudflare deployment contract. They are
untagged standard requirements, not repocheck rule waivers. A complete Remix
rewrite is tracked in [#16](https://github.com/discobox-ai/site/issues/16).
Existing ADRs were reformatted with owner approval; IDs, statuses and decision
text are preserved. No ADR-format waiver is used.

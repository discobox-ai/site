# discobox.ai

The [Discobox](https://github.com/discobox-ai/discobox) marketing site: an
[Astro](https://astro.build) static site.

## Commands

```bash
pnpm install
pnpm dev        # dev server on http://localhost:4321
pnpm build      # static build into dist/
pnpm check      # astro check (TypeScript + template diagnostics)
pnpm gen:logo   # re-sync the brand art from the discobox repository
```

## Brand assets

The brand art is committed here so the site builds and deploys on its own, but
it is **copied, not authored**: the source of truth is `assets/brand` in the
[discobox](https://github.com/discobox-ai/discobox) repository, where the mark
and wordmark came out of Illustrator. Do not hand-edit these files — change
them upstream and re-sync.

`pnpm gen:logo` does the sync. It needs a discobox checkout: set
`DISCOBOX_REPO`, or keep one beside this repository.

```
discobox: assets/brand/logo-purple.svg       -> src/assets/logo.svg
discobox: assets/brand/wordmark-gradient.svg -> src/assets/wordmark-gradient.svg
discobox: assets/brand/wordmark-white.svg    -> src/assets/wordmark-white.svg
discobox: assets/brand/favicon.svg           -> public/favicon.svg
discobox: cli/internal/tui/logo.json         -> src/data/logo.json
```

If the terminal mark itself changed, run `go tool task logo:cells` in discobox
first — that regenerates `logo.json` from the capture.

Two things about that last one, and one about the wordmarks:

- **The terminal mark is cell data, not a capture.**
  `cli/internal/tui/logo.chars` is a terminal capture of the mark and is kept
  only as provenance: it paints with 16-color indices, which every terminal
  theme redefines, and builds its solid areas from inverse-video runs, which
  paint the glyph in whatever background the terminal happens to have.
  discobox's `scripts/logo-cells.mjs` resolves both into `logo.json` — runs of
  text carrying explicit RGB. The CLI renders that through lipgloss, which
  downsamples per terminal; `TerminalMark.astro` draws the same data as SVG
  rectangles, because the block characters are absent from most monospace fonts
  and per-glyph fallback drifts the columns. Neither side interprets ANSI.
- **`logo.json` lives in `src/data`, not `src/assets`**, because `src/assets`
  is Astro's image pipeline and cell data is not an image.
- **The wordmarks are loaded as `<img>`, never inlined.** They fill their type
  from an embedded `url(#linear-gradient)`, and that reference does not survive
  being parsed as HTML — the word comes out flat white. They also carry a
  `viewBox` and no `width`/`height`, so `Wordmark.astro` restates the viewBox
  ratio as an `aspect-ratio`; without it the image paints once and collapses.

> **Note:** the wordmark art currently reads *discobot* — it was copied from
> that repository. Replace the two files upstream in discobox and run
> `pnpm gen:logo`; no code changes are needed. If the replacement has a
> different aspect ratio, update the `aspect-ratio` in `Wordmark.astro`.

## Deployment

The site is deployed by Cloudflare's **Workers & Pages GitHub App**, the same
way [docs.obot.ai](https://docs.obot.ai) is deployed from `obot-platform/obot`.
Cloudflare watches the repository, runs the build on its own infrastructure and
publishes the result. There is no deploy workflow here and no API token stored
anywhere — the only workflow, `ci.yml`, runs `astro check`, which Cloudflare's
build does not.

| Push | Result |
| --- | --- |
| `main` | Production → [discobox.ai](https://discobox.ai) |
| any other branch | Preview → `https://<branch>.discobox-site.pages.dev` |

Open the pull request from a branch **on this repository**, not from a fork.
Cloudflare does not build previews for pull requests from forks — it is a
documented [known issue](https://developers.cloudflare.com/pages/platform/known-issues/):
*"Commits/PRs from forked repositories will not create a preview."* A fork PR
still gets `ci.yml`, so it is checked and built, just without a preview URL. If
you need a preview for one, push the branch here and reopen the PR against it.

### Connecting the project

In the Cloudflare dashboard: *Workers & Pages → Create → Pages → Connect to
Git*, pick this repository, and set:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | Astro |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | *(leave empty)* |

Then add these under *Settings → Variables and secrets*, for **both** the
production and preview environments:

| Variable | Value | Why |
| --- | --- | --- |
| `PNPM_VERSION` | `11.9.0` | Required. See below. |
| `NODE_VERSION` | `24.20.0` | Belt and braces alongside `.node-version`. |

Finally, *Custom domains → Set up a custom domain* → `discobox.ai`, after the
first production deploy has something to serve.

### The two version pins are not optional

Both defaults in Cloudflare's
[v3 build image](https://developers.cloudflare.com/pages/configuration/build-image/)
are too old for this project, and one of them fails in a way that does not
obviously point at the cause:

- **pnpm.** The documented default is pnpm 10.11.1 (still 10.11.1 as of
  September 2026, on both the Pages and Workers build image pages).
  `pnpm-workspace.yaml` uses `allowBuilds`, which is
  [pnpm 11 syntax](https://pnpm.io/blog/releases/11.0) — it replaced
  `onlyBuiltDependencies`. pnpm 10 does not recognise the key, so it silently
  declines to run esbuild's install script, and the build then fails somewhere
  inside Astro looking for a binary that was never downloaded.
- **Node.** The Pages image defaults to Node 22.16.0 and `package.json`
  requires `>=24.18.0`. The v3 build system explicitly does **not** read
  `engines` from `package.json`, so the version has to come from
  `.node-version` (committed, and also what `ci.yml` reads) or `NODE_VERSION`.

Do not treat those default versions as fixed. The v3 image is the last one —
there will be no v4 — and it now takes *rolling* updates instead: minor
versions can move without notice, major versions with three months' notice via
the [changelog](https://developers.cloudflare.com/changelog/). So the reason to
pin is not only that today's defaults are too old, but that they are a moving
target. Cloudflare's own advice is the same: *"we also recommend pinning all
critical tools and languages that your project relies on."*

If a Cloudflare build fails after a dependency change, check these two first.

### If we ever need previews for fork pull requests

That is the one thing this setup cannot do, and it is a one-way door:
*"If you deploy using the Git integration, you cannot switch to Direct Upload
later."* Moving to the GitHub Actions approach means deleting the Pages project
and recreating it as a Direct Upload project, which drops the custom domain
until it is reattached. The Actions version needs a `pull_request_target`
workflow that builds the PR in a job with no secrets and deploys the artifact
from a second job gated on a GitHub Environment with required reviewers, plus a
Cloudflare API token stored as an environment secret — Cloudflare has no OIDC,
so that token would have to be copied and rotated by hand.

# discobox.ai

The [Discobox](https://github.com/discobox-ai/discobox) marketing site: an
[Astro](https://astro.build) static site.

## Commands

```bash
pnpm install
pnpm dev         # dev server on http://localhost:4321
pnpm build       # static build into dist/
pnpm check       # astro check (TypeScript + template diagnostics)
pnpm sync:assets # re-sync the brand art and screenshots from the discobox repository
```

## The install scripts

`curl -sSfL https://discobox.ai | sh` and `irm https://discobox.ai/install.ps1 |
iex` are served by the one piece of code here, [`worker/index.ts`](worker/index.ts):
a Worker in front of the static assets that `wrangler.jsonc` runs for `/`,
`/install.sh`, and `/install.ps1` only. On `/` it answers curl, wget, and
PowerShell with a script and everyone else with the site.

The scripts are not in this repository. Each discobox release uploads its own,
stamped with the release it installs, and the Worker fetches them through the
asset mirror at `assets.discobox.ai`:

| Host | Serves |
| --- | --- |
| `discobox.ai` | the newest stable release's installer (the mirror's `latest` alias) |
| `edge.discobox.ai` | the newest release's installer, prereleases included: the newer of the mirror's `latest` and `prerelease` aliases |

Why it is shaped this way — and why the rules for `edge` must match the scripts'
own — is discobox's ADR 0109.

## Brand assets and screenshots

The brand art and the screenshots are committed here so the site builds and
deploys on its own, but they are **copied, not authored**: the source of truth
is the [discobox](https://github.com/discobox-ai/discobox) repository, where the
mark and wordmark came out of Illustrator and the screenshots are captured from
a real run. Do not hand-edit these files — change them upstream and re-sync.

`pnpm sync:assets` does the sync. It needs a discobox checkout: set
`DISCOBOX_REPO`, or keep one beside this repository.

```
discobox: assets/brand/logo-purple.svg       -> src/assets/logo.svg
discobox: assets/brand/wordmark-gradient.svg -> src/assets/wordmark-gradient.svg
discobox: assets/brand/wordmark-white.svg    -> src/assets/wordmark-white.svg
discobox: assets/brand/favicon.svg           -> public/favicon.svg
discobox: cli/internal/tui/logo.json         -> src/data/logo.json
discobox: assets/screens/launcher.png        -> src/assets/screens/launcher.png
discobox: assets/screens/claude-code.png     -> src/assets/screens/claude-code.png
```

Only the shots the site places are copied; `assets/screens` upstream holds more
(the welcome screen, Codex, the tools menu, the review tool), and its README
there documents how a shot is retaken — it has to be a terminal that draws block
characters itself, or the mark comes out seamed.

> **Pending — both screenshots are to be retaken upstream.** Two reasons, and
> the retake should fix both at once:
>
> - They were captured from a checkout at `~/src/disco2`, so they publish that
>   path and a developer's shell prompt — a name that appears nowhere else here.
>   Capture from a checkout named `discobox`.
> - `⏵⏵` renders as two tofu boxes in both: before `(default)` in the launcher
>   shot, and before `bypass permissions on` in the Claude Code one. The capture
>   font has no U+23F5, and unlike the block characters the mark is drawn from,
>   that one is not something kitty draws itself — it needs a font that covers
>   it, or a `symbol_map U+23F5` in `kitty.conf` pointing at one that does.
>
> `pnpm sync:assets` picks the replacements up with no change on this side.

The two screenshots are the one thing here that is **not** copied byte for byte:
each is trimmed of the flat background the capture script frames it in, because
the site draws its own frame and would otherwise draw a second one around the
first. The amount is measured from the file on every sync rather than written
down here, so a retaken shot with different padding needs no change on this
side.

`sharp` is a dev dependency for those two: the sync trims with it, and Astro's
image pipeline needs it to emit the WebP the pages actually load. Astro declares
it as an *optional* dependency of its own, which is the failure worth knowing
about — an optional dependency that does not install is skipped silently, and
the first sign of it is `MissingSharp` from `astro build`, or a 500 from the dev
server's `/_image` route with the pages showing alt text. Declaring it directly
turns that into an install-time failure. It needs no entry in
`pnpm-workspace.yaml`'s `allowBuilds`: neither `sharp` nor its `@img/*` platform
packages run an install script.

If the terminal mark itself changed, run `go tool task logo:cells` in discobox
first — that regenerates `logo.json` from the capture.

Two things about the cell data, and one about the wordmarks:

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
> `pnpm sync:assets`; no code changes are needed. If the replacement has a
> different aspect ratio, update the `aspect-ratio` in `Wordmark.astro`.

## Deployment

The site is a **Cloudflare Worker serving static assets** — `wrangler.jsonc`
points `assets.directory` at `dist/` and there is no `main`, so no Worker code
runs. GitHub Actions builds and deploys it; Cloudflare does not watch the
repository. That keeps one build image (`.node-version` + `packageManager`) for
both the checked build and the deployed one.

| Push | Worker | URL |
| --- | --- | --- |
| `main` | `discobox-ai` | [discobox.ai](https://discobox.ai) |
| `preview` | `discobox-ai-preview` | [preview.discobox.ai](https://preview.discobox.ai) |

The two targets are the top-level config and the `preview` environment in
`wrangler.jsonc`. Wrangler derives the preview Worker's name by appending the
environment, which is why it is `discobox-ai-preview` and not something set by
hand. Both set `workers_dev: false`, so neither is reachable at a
`*.workers.dev` URL — the custom domain is the only way in.

`public/_redirects` is part of the deploy too: Workers static assets reads it
from the build output and serves it as real redirects. It currently holds one
line, keeping `/security` — the URL the architecture page shipped under first,
and the one the upstream README still links — alive as a 301 to
`/architecture`. Nothing on this site links `/security` any more, and neither
`pnpm dev` nor `pnpm preview` reads the file, so it is only ever exercised in a
real deploy: a mistake in it shows up as an external link 404ing and nowhere
else. Push to `preview` and check it against preview.discobox.ai rather than
locally.

Any other branch deploys nowhere. Open a pull request and `ci.yml` type-checks
and builds it; to see it served, push to `preview`.

### What the deploy needs

`deploy.yml` reads two repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with *Workers Scripts:Edit* on the account, plus *Zone:Read*, *Workers Routes:Edit* and *DNS:Edit* on `discobox.ai` |
| `CLOUDFLARE_ACCOUNT_ID` | `27da65de69e2c4d905c1849912684b76` (Obot AI) |

The zone permissions matter only when a custom domain is being attached or
changed; a deploy that touches no routes needs just the Workers scope. There is
no OIDC for Cloudflare, so that token is copied by hand and has to be rotated
the same way.

Fork pull requests never deploy: `deploy.yml` runs on `push`, and secrets are
withheld from fork PRs regardless. A fork PR still gets `ci.yml`.

### The pnpm pin is not optional

`pnpm-workspace.yaml` uses `allowBuilds`, which is
[pnpm 11 syntax](https://pnpm.io/blog/releases/11.0) — it replaced
`onlyBuiltDependencies`. pnpm 10 does not recognise the key, so it silently
declines to run esbuild's install script and the build then fails somewhere
inside Astro looking for a binary that was never downloaded. In CI this is
handled by `pnpm/action-setup`, which reads `packageManager` from
`package.json`; keep that field and `.node-version` in step with `engines`.

### History

The Worker was first created in the dashboard as **`discobot-ai`** — a typo,
made easier by `discobot.ai` being a real zone on the same account — and
`wrangler.jsonc` was then written to match it, so the site served from
`discobot-ai.acorn-io.workers.dev` with no custom domain attached. The rename
to `discobox-ai` created a new Worker; the old one is a separate script and has
to be deleted in the dashboard.

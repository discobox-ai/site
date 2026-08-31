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

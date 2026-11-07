# Review notes

- When a homepage section's story changes, check its card in
  `src/components/Pillars.astro` too. Each pillar restates its section in one
  line and links to it, so it never shows up in that section's diff and goes
  stale silently (it still described `discobox apply` after Parallel stopped).
- Colours, faces, radii and strokes come from `src/styles/tokens.css`, which is
  synced from discobox's `assets/brand` and follows its `LANGUAGE.md`. A literal
  hex value in a component, or a new colour the tokens do not name, is a change
  to make upstream first. Check new pieces in both themes; a picture of a
  terminal carries `.theme-dark`.

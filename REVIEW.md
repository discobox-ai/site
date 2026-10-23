# Review notes

- When a homepage section's story changes, check its card in
  `src/components/Pillars.astro` too. Each pillar restates its section in one
  line and links to it, so it never shows up in that section's diff and goes
  stale silently (it still described `discobox apply` after Parallel stopped).

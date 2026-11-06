# Review notes

- When a homepage section's story changes, check its card in
  `src/components/Pillars.astro` too. Each pillar restates its section in one
  line and links to it, so it never shows up in that section's diff and goes
  stale silently (it still described `discobox apply` after Parallel stopped).

- Give blog entries path-based IDs. Astro's default glob loader uses the
  frontmatter slug as the ID, so duplicate permalinks can overwrite content
  before validation and edit links can lose the source filename.
- Check blog links and anchors in the built output. The docs validator walks
  only imported manuals, so it cannot catch a broken release-post link.
- Exercise shared navigation at 390px after adding a link. Keeping another
  link visible on mobile can push the wordmark and actions outside the viewport.

- Snapshot symlinks with lstat/readlink when checking generated-file drift.
  Repostd requires `.claude/skills` to link to a directory; dereferencing it
  made verify fail with EISDIR during #15. Include executable bits and names
  as well as file contents so tooling changes cannot pass unnoticed.

- Generate Astro's content types before standalone TypeScript checks. In #15,
  a warm local `.astro/` hid missing `astro:content` declarations in the fresh
  CI check job; verify/check jobs do not share generated files.

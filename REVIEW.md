# Review notes

- Every command on the homepage is copied from the real CLI: the hero's
  `discobox run` line, the cards in `HowRunsWork.astro`, and the terminals in
  `Factory.astro` and `PersistentAgents.astro`. When a flag or verb changes in
  discobox, check it against `discobox --help` here too. The hero restates How
  it works in one line, so it goes stale without ever showing up in that
  section's diff.
- Colours, faces, radii and strokes come from `src/styles/tokens.css`, which is
  synced from discobox's `assets/brand` and follows its `LANGUAGE.md`, and reach
  the site, the docs and the blog through `src/styles/brand.css`. A literal hex
  value in a component, or a new colour the tokens do not name, is a change to
  make upstream first. Gold is only the one title band per view and in-between
  states; a page's one decision gets the focused `.frame`. Check new pieces in
  both themes; a picture of a terminal carries `.theme-dark`.
- Give blog entries path-based IDs. Astro's default glob loader uses the
  frontmatter slug as the ID, so duplicate permalinks can overwrite content
  before validation and edit links can lose the source filename.
- Check blog links and anchors in the built output. The docs validator walks
  only imported manuals, so it cannot catch a broken release-post link.
- Exercise shared navigation at 390px after adding a link. Keeping another
  link visible on mobile can push the wordmark and actions outside the viewport.
- Before marking a docs line `stable` (or moving `currentStable`), search its
  imported pages for prerelease or development wording. The status label comes
  from the manifest, the prose from upstream at the pinned commit, and the hash
  check cannot see the two disagree. The fix is upstream and a new import, never
  an edit to the imported pages. v0.19.0 shipped with such wording
  (discobox-ai/discobox#856).

- Give blog entries path-based IDs. Astro's default glob loader uses the
  frontmatter slug as the ID, so duplicate permalinks can overwrite content
  before validation and edit links can lose the source filename.
- Check blog links and anchors in the built output. The docs validator walks
  only imported manuals, so it cannot catch a broken release-post link.
- Exercise shared navigation at 390px after adding a link. Keeping another
  link visible on mobile can push the wordmark and actions outside the viewport.

# Review notes

- Every command on the homepage is copied from the real CLI: the hero's
  `discobox run` line, the cards in `HowRunsWork.astro`, and the terminals in
  `Factory.astro` and `PersistentAgents.astro`. When a flag or verb changes in
  discobox, check it against `discobox --help` here too. The hero restates How
  it works in one line, so it goes stale without ever showing up in that
  section's diff.
- The supported harnesses are listed in four places: the hero's note
  (`Hero.astro`), the harness card in `HowRunsWork.astro`, the Harness entry on
  `architecture.astro`, and the homepage's meta description in `index.astro`.
  Each names all of them in discobox's order and spelling (Claude Code, Codex,
  OpenCode, GitHub Copilot, pi, omp) and ends on any terminal agent in an
  image. When discobox adds or renames one, change all four:
  `rg -i "claude code" src --glob '!src/content/docs/**'` finds them. The meta
  description is easy to miss because it is in no component's diff.
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
- Check a draft post's links by building it once with `draft: false` and a
  date no later than today, confirm `dist/blog/<slug>/index.html` exists,
  and don't commit that. A draft or future-dated post produces no route, so
  the build's blog check skips it and passes, and a broken link only shows up
  when the post is published.
- Don't name a patch release as the current one in a blog post. Link the
  line's first release (`v0.19.0`) and the tags page, and let the manual
  pages name the exact version. The v0.19 draft named v0.19.1 and then v0.19.3
  as current, and each went stale before it was published.
- Exercise shared navigation at 390px after adding a link. Keeping another
  link visible on mobile can push the wordmark and actions outside the viewport.
- Before marking a docs line `stable` (or moving `currentStable`), search its
  imported pages for prerelease or development wording. The status label comes
  from the manifest, the prose from upstream at the pinned commit, and the hash
  check cannot see the two disagree. The fix is upstream and a new import, never
  an edit to the imported pages. v0.19.0 shipped with such wording
  (discobox-ai/discobox#856).
- Check a change to `_redirects` (`public/_redirects`, or the `/docs/` rules
  the build appends) under `pnpm exec wrangler dev --env preview --local`
  after a build, with `curl -sI` on each source path. `pnpm dev` and
  `pnpm preview` ignore the file, and the build check reads only the `/docs/`
  rules' text, so how a rule is actually served shows up nowhere else before
  it is deployed.
- Snapshot symlinks with lstat/readlink when checking generated-file drift.
  Repostd requires `.claude/skills` to link to a directory; dereferencing it
  made verify fail with EISDIR during #15. Include executable bits and names
  as well as file contents so tooling changes cannot pass unnoticed.
- Generate Astro's content types before standalone TypeScript checks. In #15,
  a warm local `.astro/` hid missing `astro:content` declarations in the fresh
  CI check job; verify/check jobs do not share generated files.

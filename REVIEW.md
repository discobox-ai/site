# Review notes

- Every command on the site is copied from the real CLI: the hero's terminal,
  the run line and cards in `HowRunsWork.astro`, the terminals in
  `PersonalFactory.astro`, `Factory.astro` and `PersistentAgents.astro`, and
  every terminal on `try.astro`. When a flag or verb changes in discobox, check
  it against `discobox --help` here too. The hero and the Try it page restate
  the same runs, so they go stale without ever showing up in the diff that
  changed the others.
- A secret bound for `gh` names its variable: `--bind github:GH_TOKEN` or
  `--as GH_TOKEN`. Left out, it arrives as the upper-snaked secret name
  (`GITHUB`), which `gh` ignores, so a command shown working would not.
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

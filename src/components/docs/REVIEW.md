# Docs UI review notes

- Pagefind arrays use AND semantics. The all-versions search filter must use
  `{ version: { any: lines } }`; a flat version array returns no results once
  more than one snapshot exists. Verify with two snapshots, not only v0.19.
- The search control shares the phone header with the site title and the
  menu button. Below Starlight's 50rem breakpoint it is a magnifier button
  only, as Starlight's own search is; its label and the `Ctrl K` hint would
  overflow the header and clip the title. Below 22rem even that leaves no room
  for "Discobox docs" (it clips below about 342px), so `docs.css` hides the
  title visually and the logo stands alone. When the title in
  `astro.config.mjs` changes, measure where it starts clipping and move that
  22rem query in `src/styles/docs.css` to just above it: nothing else ties the
  two together. `pnpm test:docs-header` checks this at 320, 360, 375 and
  414 px.
- Preserve periods in content IDs so minor version URLs remain `/v0.19/`.

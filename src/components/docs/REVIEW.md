# Docs UI review notes

- Pagefind arrays use AND semantics. The all-versions search filter must use
  `{ version: { any: lines } }`; a flat version array returns no results once
  more than one snapshot exists. Verify with two snapshots, not only v0.19.
- Preserve periods in content IDs so minor version URLs remain `/v0.19/`.

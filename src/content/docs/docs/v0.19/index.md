---
title: "Discobox v0.19 manual"
editUrl: https://github.com/discobox-ai/discobox/edit/589a456affc33ea8dbd2979bfd0a48427b4da16d/docs/public/index.md
---

**Prerelease documentation.** This manual describes the v0.19 development
line. It does not declare v0.19 stable. Use the exact product version and
revision shown by the documentation site's snapshot manifest; a prerelease
snapshot stays labeled prerelease until a reviewed stable import replaces it.

Discobox is a harness runtime. Give it a harness, a source and a task, and
it runs the harness in its own sandbox with its own copy of the code. The
agent has full control inside the sandbox and never waits for approval. Your
secrets stay outside it, and everything it sends leaves through one proxy.

Run one box per task side by side, keep a named agent running for months, or
add your team's skills and let a lead box run your process as a software
factory. Work comes home through Git.

- [Getting started](/docs/v0.19/getting-started/): install, configure an agent, run a task,
  and collect the work.
- [Concepts](/docs/v0.19/concepts/): boxes and sources, harnesses, skills, boxes that
  lead other boxes, providers, lifecycle and credentials.
- [Console guide](/docs/v0.19/console/): workflows, navigation and keybindings.
- [CLI reference](/docs/v0.19/cli/): generated public commands and flags.

The manual and command reference are maintained alongside the product. A
change to a command, default or console behavior must update these pages in
the same change. Documentation snapshots are imported and reviewed separately
from product releases.

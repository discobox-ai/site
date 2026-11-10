---
title: "Discobox v0.19 manual"
editUrl: https://github.com/discobox-ai/discobox/edit/3f47653772b1bc496cee4cd97ba8bb282991b5a7/docs/public/index.md
---

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

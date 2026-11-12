---
title: Discobox v0.19
description: Discobox v0.19 is out, with a versioned manual and CLI reference to get started.
author: Discobox team
slug: discobox-v0-19
published: 2026-11-12
draft: true
---

Discobox gives a coding agent its own disposable environment, with your
source checked out and a terminal you can return to.
[Discobox v0.19](https://github.com/discobox-ai/discobox/releases/tag/v0.19.1)
is out, and its manual is now the stable documentation at
[discobox.ai/docs](/docs/).

## Start with the manual

The [v0.19 getting-started guide](/docs/v0.19/getting-started/) walks through
installation and your first box. The [concepts guide](/docs/v0.19/concepts/)
explains boxes, pools and harnesses, and the
[console guide](/docs/v0.19/console/) describes the console workflow.

For commands and flags, use the [v0.19 CLI reference](/docs/v0.19/cli/).
Each manual page identifies the product revision it describes.

## What's in v0.19

- **A tour to start with.** `discobox run discobox-ai/tour` opens a guided
  tour full screen in a box before its harness starts. It needs no agent
  account. See [Take the tour](/docs/v0.19/getting-started/#take-the-tour).
- **Repository startup scripts.** On Linux boxes, a repository can ship
  `.discobox/scripts/pre-harness`, which runs interactively in the box before
  the harness. The tour is one. See
  [Repository startup scripts](/docs/v0.19/repository-scripts/).
- **Harnesses you configure once.** Claude Code, Codex, OpenCode, GitHub
  Copilot, pi, omp and a shell are included. `discobox configure` reviews
  their settings and logins, and changes made in one box are reviewed before
  they are saved back for the next. See
  [Harnesses](/docs/v0.19/concepts/#harnesses).
- **Boxes that lead other boxes.** A box created with `--discobox-api` can
  create boxes, run commands and copy files in them, and archive them when
  their work is done, which is how a software factory runs on Discobox. See
  [Boxes that lead other boxes](/docs/v0.19/concepts/#boxes-that-lead-other-boxes).
- **Credentials that stay outside the box.** A box holds a placeholder, and
  the pool proxy substitutes the real secret only for the routes a binding
  allows. An agent can ask for access it lacks, and you approve use and
  delegation separately. See [Credentials](/docs/v0.19/concepts/#credentials).
- **Images in the terminal.** An image pasted with Ctrl-V or Alt-V, or a
  dragged image file, is copied into the box and its path pasted into the
  harness. See [Work in terminals](/docs/v0.19/console/#work-in-terminals).

## Release details

v0.19.1 is the current release in the v0.19 line, and the manual on this site
is imported from it. The
[v0.19.1 release notes](https://github.com/discobox-ai/discobox/releases/tag/v0.19.1)
list what changed since v0.19.0, and the
[v0.19.0 release notes](https://github.com/discobox-ai/discobox/releases/tag/v0.19.0)
list everything that shipped in the line's first release.

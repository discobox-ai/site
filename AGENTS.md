# Repository Guidelines

## Project Structure

- `src/`: Astro marketing pages, Starlight manual UI and Markdown blog.
- `public/`: committed static assets; `worker/`: installer routing for Cloudflare.
- `scripts/`: asset/docs imports, content validators and build checks.
- `docs/`: design notes and ADRs; see [DESIGN.md](DESIGN.md).

### Branches and publishing

PRs target `preview`, never `main`. Nothing reaches `main` until a release
(0.19, 0.20); the owner promotes `preview` into `main` at release time.
A PR into `preview` does not close its issue; whoever merges it closes the
issue. Use `Refs #N` rather than an automatic closing keyword in PR bodies.

## Shared Libraries

Prefer the platform (Web APIs, `node:` modules) and the framework's own
packages over new dependencies. A generic helper useful beyond discobox-site is a
candidate for a shared discobox-ai package, not a copy here.

## Commands

package.json scripts, run with pnpm, which installs the pnpm and node
versions package.json pins:

```bash
pnpm install
pnpm run build      # build and validate the static site
pnpm run dev        # run with hot reloading, where there is a program
pnpm run test       # run tests
pnpm run check      # oxlint, oxfmt, TypeScript and Astro diagnostics
pnpm run fmt        # format with oxfmt
pnpm run generate   # regenerate generated files
pnpm run verify     # formatting and generated files are current
pnpm run ci         # everything CI runs: verify, check, test
```

Before opening a PR, run `pnpm run ci` and `pnpm run build`. Add package.json
scripts instead of documenting ad hoc commands here.

## Implementation Quality

Prefer proper structural changes over compatibility shims or narrow patches.

- Do not introduce optional interfaces for behavior the system requires. Add
  required methods to the core interface and update all implementations.
- Do not add wrapper types, adapter layers, or helper wrappers just to avoid
  touching callers. Change the call sites.
- Treat existing databases and persisted state as durable. Design schema
  changes with a safe upgrade path.
- When the correct fix crosses package boundaries, update the model,
  interfaces, implementations, tests, and call sites together.
- Keep abstractions justified by durable ownership or meaningful complexity
  reduction.

## Package Design Docs

`DESIGN.md` explains the design of a package and its subdirectories.
`REVIEW.md` holds its review notes: what to check and the pitfalls already
hit. Read both from the root down to every package you are changing or
reviewing; closer files override parents. When reviewing, a change that
breaks a `REVIEW.md` note is a finding.

Add a bullet to the closest `REVIEW.md` when you find something non-obvious a
future review should check, when the same mistake is made a second time, or
when you fix a regression. The bullet states the rule, then why. The author
writes it, in the change that fixes what prompted it; a reviewer that thinks
one is due says so in its comment. Keep both files short and directive,
describe current state only, and update them in the same change as the code.
See the `repostd` skill for the rules.

## Architecture Decision Records

`docs/adr` records decisions and the alternatives rejected. Write an ADR only
when a plausible alternative was rejected for a non-obvious reason, or
something was deferred with a condition for revisiting it. Land it as
`Proposed`; `Accepted` is the go-ahead. ADRs are immutable once shipped
against: supersede, never edit. See `docs/adr/README.md`.

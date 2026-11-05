# Working on discobox.ai

## Pull requests and releases

- Target every pull request at `preview`, never `main`, even though `main`
  is GitHub's default branch.
- Nothing reaches `main` until a Discobox release (such as 0.19 or 0.20).
  The owner merges `preview` into `main` at release time.
- Merging a pull request into `preview` does not close its issue. Whoever
  merges the pull request must close the issue explicitly.

## Checks before opening a pull request

Use the Node version in `.node-version` and the pnpm version pinned in
`package.json`. Install dependencies with `pnpm install --frozen-lockfile`,
then run the checks used by CI:

```bash
pnpm check
pnpm test:blog
SITE_PREVIEW=true pnpm build
```

# ADR 0002: Main documentation line

- Status: Proposed
- Date: 2026-11-04
- Scope: [site #7](https://github.com/discobox-ai/site/issues/7)
- Amends: [ADR 0001: Docs and blog on discobox.ai](https://github.com/discobox-ai/site/blob/9f2853d57f2fa73d3dd0341bfe7108fe5fc8593c/docs/adr/0001-docs-and-blog.md)

## Context

ADR 0001 was accepted by the owner merging [site #5](https://github.com/discobox-ai/site/pull/5)
into `main`; its text still says Proposed pending implementation. This
amendment is independently Proposed. It changes only **Source ownership and
imports**, **Release versioning and URLs**, **Search**, and the corresponding
**Delivery and acceptance** requirements. All other decisions remain in force.

At preview commit `70bebda`, `src/pages/` contains only the home and
architecture pages. `package.json` has no docs framework or import command;
`.github/workflows/ci.yml` checks and builds PRs, and `deploy.yml` deploys
pushes to `main` and `preview`. There is no scheduled docs importer. ADR 0001
and its index are present on `main` but absent from this preview baseline;
this proposal links the accepted record rather than copying unrelated history.

The release-only scheme cannot show documentation for work on product
`main`. The owner requests `/docs/main/` alongside minor release lines,
while `/docs/` continues to select the latest stable release. This is
additional scope, not part of v0.19 unless the owner explicitly adds it.

## Proposed decision

### Source ownership and imports

Add one committed snapshot for discobox-ai/discobox `main`, using the same
explicit public-document inventory, link/asset rewriting, attribution,
upstream edit links, and generated CLI reference rules as release snapshots.
Resolve `main` once to a full commit SHA before importing. Import prose and
assets and generate the CLI reference from that exact checkout, never from
separately resolved moving refs. Record the full SHA, source branch, file
mapping, and generator version/command in the committed snapshot manifest;
a release tag is not applicable to this line. The displayed short SHA must
identify that recorded full SHA and link to the upstream commit.

Normal site builds, including fork PR builds, consume only committed content
and metadata. They neither fetch upstream docs nor execute upstream product
code or the reference generator. A failed import leaves the published
snapshot at its last reviewed revision; it must not publish partial output.

Replace ADR 0001's deferral of automatic imports **for this main line only**
with a scheduled trusted workflow in this repository. The workflow definition
runs from the site's default branch (GitHub's scheduled-workflow source),
resolves the public product `main` without a product credential, imports and
generates in an isolated job, validates the complete snapshot, and opens or
updates one refresh PR targeting **preview**, never pushes directly to
`preview` or site `main`. No content change means no PR. Keep the recorded
SHA current when content changes and avoid accumulating competing refresh PRs.

Treat executing the upstream generator as executing product code. The import
job gets no site write credential, deployment secret, or persisted Git
credential. A separate publication job uses narrowly scoped site credentials
to commit validated snapshot output and manage the refresh PR. It does not
execute imported content or upstream scripts. Use ordinary PR checks and
human review; do not use `pull_request_target` to execute a PR's code with
write access. Validate that only approved snapshot paths and metadata change.
The workflow must create PRs in a way that triggers the repository's required
checks; do not assume PRs created with `GITHUB_TOKEN` trigger new workflows.

The review PR identifies the previous and new product SHAs, generator command,
and validation results. Merging it publishes to preview through the existing
deploy path; production publication still requires the site's normal
promotion from preview to main. This is periodic snapshot publication, not a
promise that the live site tracks every upstream commit immediately.

### Release versioning and URLs

Serve the main landing page at `/docs/main/` and its pages beneath it;
`/docs/main` resolves to that landing page. Every main page prominently shows
**unreleased — main @ <sha>**, with the SHA from its committed manifest.
It must explain that instructions describe unreleased product behavior.

Keep `/docs/` redirecting to the current stable minor line, controlled by the
committed versions manifest. Main is an explicit picker option, never the
picker's default or the stable redirect target. On a main page the picker
shows Main as the current selection; arriving without an explicit selection
uses stable. Preserve matching pages when switching lines and fall back to
the selected line's landing page for missing pages, as in ADR 0001.

This narrowly replaces the initial exclusion of a development manual: there
is still no unversioned duplicate manual or `/next/` alias. Patch releases
continue refreshing their own minor line's snapshot via reviewed imports,
with exact provenance in Git and no per-patch URL. Never regenerate a release
line from product main as a side effect of the main refresh.

### Indexing and search

Every main page carries `noindex` in the served HTML and is omitted from the
sitemap, including on the production and edge hosts. Do not rely on a
robots.txt disallow rule to deliver the noindex instruction. Preview retains
ADR 0001's site-wide indexing exclusion.

Exclude main from default docs search results, including the default
all-release-lines search. Make main searchable only through an explicit Main
search scope; being on a main page alone does not enable that scope. Label
those results unreleased with their snapshot SHA. Preserve ADR 0001's static
Pagefind approach and release-line filtering. Search scoping is implementation
work, not an assumed framework feature.

### Delivery and acceptance

Implementation must demonstrate on the built site that:

- `/docs/` still resolves to stable, while `/docs/main` and nested main pages
  resolve and display the recorded SHA and unreleased banner.
- Main is never an implicit picker choice; matching-page and missing-page
  transitions work between main and release lines.
- Main HTML is noindex, sitemap entries omit it, default search excludes it,
  and explicitly scoped main search returns clearly labeled main results.
- A refresh resolves one upstream SHA, generates the CLI reference from it,
  commits complete provenance, and opens a checked, reviewed PR into preview.
  Missing inputs, broken links, or generator failures cannot replace the
  last complete snapshot. Unchanged inputs do not create duplicate PRs.
- A clean ordinary build succeeds from committed snapshots without a product
  checkout or upstream content fetch. Reverting a refresh restores the prior
  snapshot. Release-line content and stable promotion remain independent.

## Alternatives

| Option | Reason to reject |
| --- | --- |
| Keep release docs only | Cannot read instructions for product main. |
| Fetch main at build or request time | Breaks pinned provenance and makes publication depend on a moving upstream source. |
| Make main the `/docs/` target or picker default | Sends released-product users to unreleased instructions. |
| Publish main at `/next/` as well | Adds an unnecessary second identity for the requested line. |
| Manual-only refreshes | Does not meet the requested scheduled refresh workflow. |
| Let the import job write directly to preview | Skips review and exposes site write access to the upstream generator. |

## Open decisions and implementation gates

**Owner decision remains open:** whether docs-only refresh PRs may auto-merge.
This proposal grants no auto-merge authority; human review is required until
that policy is explicitly settled. Workflow implementation must not silently
enable auto-merge based on changed-file paths.

Implementation must settle the schedule cadence, trusted workflow deployment
to the default branch, narrow site PR credential mechanism, generation command,
manifest schema, content-path allowlist, and search UI. Inventory the upstream
public docs and exporter first; this proposal does not claim an exporter exists.
Preserve ADR 0001's Starlight/Astro compatibility gate. These implementation
details must satisfy the contracts above and remain outside this ADR-only PR.

No routes, snapshots, dependencies, workflows, or deployment behavior are
implemented here. Acceptance is by owner merge into preview; implementation
records that acceptance separately. This record remains **Proposed**.

## References

- [GitHub scheduled workflow rules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule): schedules run from the default branch.
- [Triggering workflows from workflows](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow): token choice affects automatic checks and approval requirements.

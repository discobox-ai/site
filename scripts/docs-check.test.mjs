import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const script = resolve('scripts/import-docs.mjs')
function check(change = () => {}, content = 'manual') {
  const directory = mkdtempSync(join(tmpdir(), 'site-docs-check-'))
  try {
    const page = 'src/content/docs/docs/v0.19/index.md'
    mkdirSync(join(directory, 'src/data'), { recursive: true })
    mkdirSync(join(directory, 'src/content/docs/docs/v0.19'), { recursive: true })
    writeFileSync(join(directory, page), content)
    const manifest = {
      defaultVersion: 'v0.19',
      currentStable: 'v0.19',
      versions: [
        {
          line: 'v0.19',
          status: 'stable',
          version: 'v0.19.0',
          tag: 'v0.19.0',
          commit: 'a'.repeat(40),
          files: [
            {
              source: 'docs/public/index.md',
              output: page,
              slug: '',
              outputHash: createHash('sha256').update('manual').digest('hex'),
            },
          ],
        },
      ],
    }
    change(manifest)
    writeFileSync(join(directory, 'src/data/docs-versions.json'), JSON.stringify(manifest))
    return spawnSync(process.execPath, [script, '--check'], { cwd: directory, encoding: 'utf8' })
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}
test('tagged stable snapshot passes; source snapshot cannot become stable', () => {
  assert.equal(check().status, 0)
  assert.notEqual(check((m) => (m.versions[0].tag = null)).status, 0)
})
test('stable promotion rejects release candidates and other minor lines', () => {
  for (const tag of ['v0.19.0-rc.3', 'v0.18.1']) {
    const result = check((m) => {
      m.versions[0].tag = tag
      m.versions[0].version = tag
    })
    assert.notEqual(result.status, 0, tag)
  }
})
test('displayed version cannot disagree with release provenance', () => {
  assert.notEqual(check((m) => (m.versions[0].version = 'v0.20.0')).status, 0)
})
test('edited imported content fails its consistency check', () => {
  assert.notEqual(check(() => {}, 'edited manual').status, 0)
})

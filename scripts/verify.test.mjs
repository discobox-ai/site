import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function fixture(formatSource, run) {
  const dir = mkdtempSync(join(tmpdir(), 'site-verify-'))
  try {
    mkdirSync(join(dir, '.agents/skills'), { recursive: true })
    mkdirSync(join(dir, '.claude'))
    writeFileSync(join(dir, '.agents/skills/fixture.md'), 'skill\n')
    symlinkSync('../.agents/skills', join(dir, '.claude/skills'))
    symlinkSync('input.txt', join(dir, 'file-link'))
    writeFileSync(join(dir, 'input.txt'), 'original\n')
    writeFileSync(join(dir, 'deleted.txt'), 'deleted before verify\n')
    copyFileSync(new URL('./verify.mjs', import.meta.url), join(dir, 'verify.mjs'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        private: true,
        packageManager: 'pnpm@11.9.0',
        scripts: { fmt: 'node format.mjs', generate: 'node --version' },
      }),
    )
    writeFileSync(join(dir, 'format.mjs'), formatSource)
    writeFileSync(join(dir, '.gitignore'), 'node_modules/\n')
    execFileSync('pnpm', ['install', '--lockfile-only', '--ignore-scripts'], {
      cwd: dir,
      stdio: 'pipe',
    })
    execFileSync('git', ['init', '-q'], { cwd: dir })
    execFileSync('git', ['add', '.'], { cwd: dir })
    rmSync(join(dir, 'deleted.txt'))
    const verify = () => execFileSync(process.execPath, ['verify.mjs'], { cwd: dir, stdio: 'pipe' })
    run(verify)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('verify accepts unchanged directory/file symlinks and existing tracked deletions', () => {
  fixture('', (verify) => assert.doesNotThrow(verify))
})

test('verify rejects formatter changes to content, symlink targets and executable bits', () => {
  const changes = [
    "writeFileSync('input.txt', 'changed\\n')",
    "unlinkSync('file-link'); symlinkSync('format.mjs', 'file-link')",
    "chmodSync('input.txt', 0o755)",
  ]
  for (const change of changes) {
    fixture(
      `import { writeFileSync, unlinkSync, symlinkSync, chmodSync } from 'node:fs'; ${change}`,
      (verify) => {
        assert.throws(verify, (error) =>
          String(error.stderr).includes('Formatting or generation changed'),
        )
      },
    )
  }
})

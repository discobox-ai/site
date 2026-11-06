import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { lstatSync, readFileSync, readlinkSync } from 'node:fs'

// Include untracked files so this check also works before the first commit.
function snapshot() {
  const paths = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
  const hash = createHash('sha256')
  for (const path of [...new Set(paths)].sort()) {
    let stat
    try {
      stat = lstatSync(path)
    } catch (error) {
      if (error.code === 'ENOENT') continue // A tracked deletion is part of the starting tree.
      throw error
    }
    const type = stat.isSymbolicLink() ? 'symlink' : 'file'
    const content = stat.isSymbolicLink() ? Buffer.from(readlinkSync(path)) : readFileSync(path)
    // Frame metadata and bytes separately; hash link targets without following directory links.
    hash.update(JSON.stringify([path, type, stat.mode & 0o111, content.length]) + '\n')
    hash.update(content)
  }
  return hash.digest('hex')
}

const before = snapshot()
for (const script of ['fmt', 'generate']) {
  execFileSync('pnpm', ['run', script], { stdio: 'inherit' })
}
if (snapshot() !== before) {
  throw new Error(
    'Formatting or generation changed repository files; review and commit the changes.',
  )
}

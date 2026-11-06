import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
const hash = (s) => createHash('sha256').update(s).digest('hex')
const path = 'src/data/docs-versions.json'
const manifest = JSON.parse(readFileSync(path, 'utf8'))
const check = process.argv.includes('--check')
const lines = new Set()
const outputs = new Set()
for (const version of manifest.versions) {
  if (!/^v\d+\.\d+$/.test(version.line) || lines.has(version.line))
    throw Error('Invalid or duplicate release line')
  lines.add(version.line)
  if (
    !/^[a-f0-9]{40}$/.test(version.commit) ||
    !['prerelease', 'stable', 'unsupported'].includes(version.status)
  )
    throw Error('Invalid version metadata')
  if (version.tag) {
    if (version.version !== version.tag)
      throw Error('Displayed product version must match its release tag')
    const release = /^v(\d+\.\d+)\.\d+(-[0-9A-Za-z.-]+)?$/.exec(version.tag)
    if (!release || `v${release[1]}` !== version.line)
      throw Error('Release tag must match its minor line')
    if (version.status === 'stable' && release[2])
      throw Error('Stable documentation cannot use a prerelease tag')
  } else if (version.status === 'stable')
    throw Error('Stable documentation requires an exact release tag')
  if (!version.files.some((f) => f.slug === '')) throw Error('Version landing page missing')
  for (const file of version.files) {
    if (!/^docs\/public\/[a-z-]+\.md$/.test(file.source) || !/^[a-z-]*$/.test(file.slug))
      throw Error('Invalid public source mapping')
    const expected = `src/content/docs/docs/${version.line}/${file.slug || 'index'}.md`
    if (file.output !== expected || outputs.has(file.output))
      throw Error('Invalid or duplicate output mapping')
    outputs.add(file.output)
  }
  for (const file of version.attribution || []) {
    if (
      !['LICENSE', 'NOTICE'].includes(file.source) ||
      file.output !== `public/docs-attribution/${version.line}/${file.source}`
    )
      throw Error('Invalid attribution mapping')
  }
}
if (!lines.has(manifest.defaultVersion)) throw Error('Default version missing')
if (
  manifest.currentStable &&
  !manifest.versions.some((v) => v.line === manifest.currentStable && v.status === 'stable')
)
  throw Error('Stable target is not stable')

if (check) {
  for (const version of manifest.versions) {
    for (const file of [...version.files, ...(version.attribution || [])]) {
      if (hash(readFileSync(file.output)) !== file.outputHash)
        throw Error(`Snapshot changed: ${file.output}; reimport upstream`)
    }
  }
  for (const file of readdirSync('src/content/docs/docs', { recursive: true })) {
    const path = `src/content/docs/docs/${file}`
    if (/\.mdx?$/.test(file) && !outputs.has(path)) throw Error(`Unmanifested manual page: ${path}`)
  }
  console.log('Documentation snapshot hashes and version metadata verified')
} else {
  const checkout = resolve(process.argv[2] || process.env.DISCOBOX_REPO || '../discobox')
  const version = manifest.versions.find((v) => v.line === process.argv[3])
  if (!version) throw Error('Usage: pnpm import:docs CHECKOUT v0.19')
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: checkout,
    encoding: 'utf8',
  }).trim()
  if (
    version.tag &&
    execFileSync('git', ['rev-parse', `${version.tag}^{commit}`], {
      cwd: checkout,
      encoding: 'utf8',
    }).trim() !== revision
  )
    throw Error('Release tag does not match pinned revision')
  if (revision !== version.commit) throw Error(`Checkout must be at ${version.commit}`)
  if (execFileSync('git', ['status', '--porcelain'], { cwd: checkout, encoding: 'utf8' }).trim())
    throw Error('Upstream docs/CLI checkout is dirty')
  execFileSync('go', ['tool', 'task', 'docs:check'], { cwd: checkout, stdio: 'inherit' })
  const pending = []
  for (const file of version.files) {
    const source = readFileSync(resolve(checkout, file.source), 'utf8')
    let body = source.replace(/^# (.+)\n+/, '')
    body = body.replace(/\]\(([^)]+)\)/g, (match, target) => {
      if (/^(https?:|mailto:|#)/.test(target)) return match
      const [name, anchor = ''] = target.split('#')
      const mapped = version.files.find((f) => f.source === `docs/public/${name}`)
      if (!mapped) throw Error(`Unresolved link/asset ${target} in ${file.source}`)
      return `](/docs/${version.line}/${mapped.slug ? mapped.slug + '/' : ''}${anchor ? '#' + anchor : ''})`
    })
    const output = `---\ntitle: ${JSON.stringify(file.title)}\neditUrl: https://github.com/discobox-ai/discobox/edit/${version.commit}/${file.source}\n---\n\n${body}`
    pending.push([file.output, output])
    file.sourceHash = hash(source)
    file.outputHash = hash(output)
  }
  for (const file of version.attribution || []) {
    const source = readFileSync(resolve(checkout, file.source))
    pending.push([file.output, source])
    file.outputHash = hash(source)
  }
  for (const [outputPath, content] of pending) {
    mkdirSync(resolve(outputPath, '..'), { recursive: true })
    writeFileSync(outputPath, content)
  }
  writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`Imported ${version.line} at ${revision}`)
}

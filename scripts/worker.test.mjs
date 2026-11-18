// The install-script Worker, with fetch stubbed so no network is reached.
import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import worker from '../worker/index.ts'

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})

const site = { fetch: async () => new Response('site') }
const browser = 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0'

// Serves `routes`: `{ redirect }` is a 302 there, `{ body }` a 200 with that body,
// and any other URL a 404.
// Every requested URL is recorded, so a test can say what was never asked for.
function stub(routes) {
  const asked = []
  globalThis.fetch = async (input) => {
    const url = String(input)
    asked.push(url)
    if (!(url in routes)) return new Response('not found', { status: 404 })
    const route = routes[url]
    if (route.redirect)
      return new Response(null, { status: 302, headers: { location: route.redirect } })
    return new Response(route.body)
  }
  return asked
}

const get = (url, userAgent = browser) =>
  worker.fetch(new Request(url, { headers: { 'user-agent': userAgent } }), { ASSETS: site })

const main = 'https://github.com/discobox-ai/discobox-main/releases'
const tag = 'v0.19.7-main.3218.geeca50b'
const mainBuild = (script) => ({
  [`${main}/latest/download/${script}`]: {
    redirect: `${main}/download/${tag}/${script}`,
  },
  [`${main}/download/${tag}/${script}`]: { body: `# ${script} for ${tag}\n` },
})

test('main.discobox.ai/ gives a browser the newest main build install.sh', async () => {
  const asked = stub(mainBuild('install.sh'))
  const response = await get('https://main.discobox.ai/')
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('x-discobox-release'), tag)
  assert.equal(await response.text(), `# install.sh for ${tag}\n`)
  assert.ok(
    asked.every((url) => url.startsWith(`${main}/`)),
    asked.join('\n'),
  )
})

test('main.discobox.ai answers curl, wget and PowerShell', async () => {
  stub({ ...mainBuild('install.sh'), ...mainBuild('install.ps1') })
  for (const [path, agent, script] of [
    ['/', 'curl/8.11.1', 'install.sh'],
    ['/', 'Wget/1.25.0', 'install.sh'],
    ['/install.sh', browser, 'install.sh'],
    ['/', 'Mozilla/5.0 (Windows NT 10.0) WindowsPowerShell/5.1', 'install.ps1'],
    ['/install.ps1', 'PowerShell/7.5', 'install.ps1'],
  ]) {
    const response = await get(`https://main.discobox.ai${path}`, agent)
    assert.equal(await response.text(), `# ${script} for ${tag}\n`, `${path} as ${agent}`)
  }
})

test('main.discobox.ai fails as a script when there is no main build', async () => {
  stub({})
  const sh = await get('https://main.discobox.ai/', 'curl/8.11.1')
  assert.equal(sh.status, 502)
  assert.match(
    await sh.text(),
    /^printf 'error: .*main installer.*GitHub named no main build for install\.sh/,
  )
  const ps1 = await get('https://main.discobox.ai/install.ps1', 'PowerShell/7.5')
  assert.equal(ps1.status, 502)
  assert.match(await ps1.text(), /^throw '.*GitHub named no main build for install\.ps1/)
})

test('discobox.ai/ is still the site to a browser', async () => {
  const asked = stub({})
  assert.equal(await (await get('https://discobox.ai/')).text(), 'site')
  assert.equal(await (await get('https://preview.discobox.ai/')).text(), 'site')
  assert.deepEqual(asked, [])
})

test('edge.discobox.ai still serves the newer of the mirror aliases', async () => {
  const mirror = 'https://assets.discobox.ai/discobox'
  stub({
    [`${mirror}/latest/install.sh`]: { redirect: '/discobox/v0.19.3/install.sh' },
    [`${mirror}/prerelease/install.sh`]: { redirect: '/discobox/v0.20.0-alpha.1/install.sh' },
    [`${mirror}/v0.20.0-alpha.1/install.sh`]: { body: '# edge\n' },
  })
  const response = await get('https://edge.discobox.ai/')
  assert.equal(response.headers.get('x-discobox-release'), 'v0.20.0-alpha.1')
  assert.equal(await response.text(), '# edge\n')
})

// The Worker in front of discobox.ai's static assets. It exists to serve the
// discobox install scripts at the addresses discobox's ADR 0109 gives them:
//
//   discobox.ai/              the stable installer to curl, wget, and PowerShell
//   discobox.ai/install.sh    the stable install.sh, to anyone
//   discobox.ai/install.ps1   the stable install.ps1, to anyone
//   edge.discobox.ai/...      the same three paths, for the edge installer
//
// wrangler.jsonc runs it for those three paths only, so every other request is
// the static site and never reaches this code. On `/`, anything that is not
// curl, wget, or PowerShell — a browser, a bot unfurling a link — gets the site.
//
// Each release uploads its own installer, stamped with what it installs, and
// the asset mirror fronts them: its `latest` alias is the newest release marked
// stable, its `prerelease` alias the newest one that is not. Stable is the
// first; edge is whichever of the two is newer, because the prerelease alias on
// its own drifts back to an old alpha once everything newer is blessed.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

type Script = 'install.sh' | 'install.ps1';

const mirror = 'https://assets.discobox.ai/discobox';
const releases = 'https://github.com/discobox-ai/discobox/releases';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const script = chooseScript(url.pathname, request.headers.get('user-agent') ?? '', url.hostname.startsWith('edge.'));
    if (!script || (request.method !== 'GET' && request.method !== 'HEAD')) {
      return env.ASSETS.fetch(request);
    }
    const channel = url.hostname.startsWith('edge.') ? 'edge' : 'stable';
    try {
      const { tag, body } = channel === 'edge' ? await edgeInstaller(script) : await stableInstaller(script);
      return new Response(request.method === 'HEAD' ? null : body, {
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=300',
          'x-discobox-release': tag,
        },
      });
    } catch (error) {
      const message = `discobox.ai could not fetch the ${channel} installer: ${error instanceof Error ? error.message : String(error)}`;
      // A valid script either way, so a `curl | sh` without -f still says why.
      const body =
        script === 'install.sh' ? `printf 'error: %s\\n' '${message.replaceAll("'", '')}' >&2\nexit 1\n` : `throw '${message.replaceAll("'", '')}'\n`;
      return new Response(body, { status: 502, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
    }
  },
};

function chooseScript(path: string, userAgent: string, edge: boolean): Script | null {
  if (path === '/install.sh') return 'install.sh';
  if (path === '/install.ps1') return 'install.ps1';
  if (path !== '/') return null;
  if (/PowerShell/i.test(userAgent)) return 'install.ps1';
  if (edge || /^(curl|wget)\//i.test(userAgent)) return 'install.sh';
  return null;
}

// The newest stable release's installer: the mirror's alias, then GitHub's own,
// which resolve the same release.
async function stableInstaller(script: Script): Promise<{ tag: string; body: string }> {
  const response = await firstFound([`${mirror}/latest/${script}`, `${releases}/latest/download/${script}`]);
  if (!response) throw new Error(`no stable release has ${script} yet`);
  return { tag: tagIn(response.url) ?? 'unknown', body: await response.text() };
}

async function edgeInstaller(script: Script): Promise<{ tag: string; body: string }> {
  const [stable, prerelease] = await Promise.all([aliasTag('latest', script), aliasTag('prerelease', script)]);
  let tag = stable;
  if (prerelease && (!stable || newer(prerelease, stable))) tag = prerelease;
  if (!tag) throw new Error('the mirror named no release for either alias');
  const response = await firstFound([`${mirror}/${tag}/${script}`, `${releases}/download/${tag}/${script}`]);
  if (!response) throw new Error(`${tag} has no ${script}`);
  return { tag, body: await response.text() };
}

// The first source that answers with the file. One that cannot be reached at
// all is passed over like one that does not have it: the mirror being down is
// exactly what GitHub is behind it for.
async function firstFound(sources: string[]): Promise<Response | null> {
  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (response.ok) return response;
    } catch {
      // Try the next one.
    }
  }
  return null;
}

// The release a mirror alias redirects to. It redirects without checking the
// asset exists, which is fine: only the tag is wanted here.
async function aliasTag(alias: 'latest' | 'prerelease', script: Script): Promise<string | null> {
  try {
    const response = await fetch(`${mirror}/${alias}/${script}`, { redirect: 'manual' });
    return tagIn(new URL(response.headers.get('location') ?? '', mirror).pathname);
  } catch {
    return null;
  }
}

// The discobox release tag in an asset URL, from either the mirror or GitHub.
function tagIn(url: string): string | null {
  const match = /\/(v[0-9][0-9A-Za-z.+-]*)\/install\.ps1$|\/(v[0-9][0-9A-Za-z.+-]*)\/install\.sh$/.exec(url);
  return match ? (match[1] ?? match[2] ?? null) : null;
}

// Whether a's MAJOR.MINOR.PATCH is above b's. A stable release is always a dot
// release, so that is all edge needs, and stable wins a tie.
function newer(a: string, b: string): boolean {
  const core = (tag: string) => tag.replace(/^v/, '').replace(/[-+].*$/, '').split('.').map(Number);
  const [x, y] = [core(a), core(b)];
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0);
  }
  return false;
}

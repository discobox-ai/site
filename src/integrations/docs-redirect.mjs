// @ts-check
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// The `_redirects` rules that send `/docs/` to the current stable line, or none
// while no line is stable. A static build can only write Astro.redirect as a
// page with a meta refresh, so the real HTTP redirect comes from `_redirects`,
// which Workers static assets serves before any page. src/pages/docs/index.astro
// keeps that page as the fallback, and scripts/check-docs-build.mjs checks the
// two against the manifest.
/** @param {{ currentStable?: string | null }} manifest */
export function docsRedirectRules(manifest) {
  const stable = manifest.currentStable;
  if (!stable) return [];
  return ['/docs', '/docs/'].map((from) => `${from} /docs/${stable}/ 302`);
}

/**
 * Appends the rules to the `_redirects` that Astro copied from public/.
 * @param {{ currentStable?: string | null }} manifest
 * @returns {import('astro').AstroIntegration}
 */
export default function docsRedirect(manifest) {
  return {
    name: 'docs-redirect',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const rules = docsRedirectRules(manifest);
        if (rules.length === 0) return;
        const path = fileURLToPath(new URL('_redirects', dir));
        let existing = '';
        try {
          existing = await readFile(path, 'utf8');
        } catch (error) {
          if (/** @type {NodeJS.ErrnoException} */ (error).code !== 'ENOENT') throw error;
        }
        const separator = existing === '' || existing.endsWith('\n') ? '' : '\n';
        const block = ['', '# /docs/ to the current stable line, from currentStable in src/data/docs-versions.json.', ...rules, ''].join('\n');
        await writeFile(path, existing + separator + block);
        logger.info(`/docs/ redirects to /docs/${manifest.currentStable}/ (302)`);
      },
    },
  };
}

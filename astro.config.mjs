// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import versions from './src/data/docs-versions.json' with { type: 'json' };
import docsRedirect from './src/integrations/docs-redirect.mjs';
export default defineConfig({
  site: 'https://discobox.ai',
  devToolbar: { enabled: false },
  integrations: [docsRedirect(versions), starlight({
    title: 'Discobox docs',
    customCss: ['./src/styles/docs.css'],
    logo: { src: './public/favicon.svg', replacesTitle: false },
    components: {
      PageTitle: './src/components/docs/PageTitle.astro',
      Search: './src/components/docs/Search.astro',
      Head: './src/components/docs/Head.astro',
    },
    sidebar: versions.versions.map(v => ({ label: `${v.line} · ${v.status}`, items: v.files.map(f => ({ label: f.title, link: `/docs/${v.line}/${f.slug ? f.slug + '/' : ''}` })) })),
    social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/discobox-ai/discobox' }],
  })],
});

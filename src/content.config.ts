import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
export const collections = {
  blog: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/blog', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
    schema: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      author: z.string().trim().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      draft: z.boolean(),
    }).refine(data => !data.updated || data.updated >= data.published, {
      message: 'updated must be on or after published',
    }),
  }),
  docs: defineCollection({ loader: docsLoader({ generateId: ({ entry }) => entry.replace(/\.[^.]+$/, '').replace(/\/index$/, '') }), schema: docsSchema() }),
  i18n: defineCollection({ loader: i18nLoader(), schema: i18nSchema() }),
};

import { getCollection } from 'astro:content';

// One inclusion rule for routes, listings, and the feed, including previews.
export async function publishedPosts() {
  const now = new Date();
  const posts = await getCollection('blog');
  const slugs = new Set<string>();
  for (const post of posts) {
    if (slugs.has(post.data.slug)) throw new Error(`Duplicate blog slug: ${post.data.slug}`);
    slugs.add(post.data.slug);
  }
  return posts.filter(post => !post.data.draft && post.data.published <= now)
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf() || a.data.slug.localeCompare(b.data.slug));
}

export const postURL = (slug: string) => `/blog/${slug}/`;
export const formatDate = (date: Date) => new Intl.DateTimeFormat('en', {
  dateStyle: 'long', timeZone: 'UTC',
}).format(date);

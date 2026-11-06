import rss from '@astrojs/rss'
import { publishedPosts, postURL } from '../../lib/blog.ts'
export async function GET() {
  return rss({
    title: 'Discobox blog',
    description: 'News and release notes from Discobox.',
    site: 'https://discobox.ai',
    items: (await publishedPosts()).map(({ data }) => ({
      title: data.title,
      description: data.description,
      pubDate: data.published,
      link: postURL(data.slug),
    })),
  })
}

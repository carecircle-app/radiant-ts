import { image } from '@/sanity/image';
import { getPostsForFeed } from '@/sanity/queries';
import { Feed } from 'feed';
import assert from 'node:assert';
import { projectId, dataset } from '@/sanity/env';

export async function GET(req: Request) {
  // Guard: don’t break the build if Sanity isn’t configured
  if (!projectId || !dataset) {
    return new Response('', { status: 204, headers: { 'cache-control': 's-maxage=60' } });
  }
  // Guard: Sanity projectId must be lowercase a–z, 0–9, or dashes
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    return new Response('', { status: 204, headers: { 'cache-control': 's-maxage=60' } });
  }

  const siteUrl = new URL(req.url).origin;

  const feed = new Feed({
    title: 'The Radiant Blog',
    description:
      'Stay informed with product updates, company news, and insights on how to sell smarter at your company.',
    author: { name: 'Michael Foster', email: 'michael.foster@example.com' },
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: { rss2: `${siteUrl}/blog/feed.xml` },
  });

  const { data: posts } = await getPostsForFeed();

  posts.forEach((post: any) => {
    try {
      assert(typeof post.title === 'string');
      assert(typeof post.slug === 'string');
      assert(typeof post.excerpt === 'string');
      assert(typeof post.publishedAt === 'string');
    } catch (err) {
      console.log('Post missing required fields for RSS feed:', post, err);
      return;
    }

    feed.addItem({
      title: post.title,
      id: post.slug,
      link: `${siteUrl}/blog/${post.slug}`,
      content: post.excerpt,
      image: post.mainImage
        ? image(post.mainImage).size(1200, 800).format('jpg').url().replaceAll('&', '&amp;')
        : undefined,
      author: post.author?.name ? [{ name: post.author.name }] : [],
      contributor: post.author?.name ? [{ name: post.author.name }] : [],
      date: new Date(post.publishedAt),
    });
  });

  return new Response(feed.rss2(), {
    status: 200,
    headers: {
      'content-type': 'application/xml',
      'cache-control': 's-maxage=31556952',
    },
  });
}

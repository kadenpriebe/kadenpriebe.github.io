import { getBlogPosts } from './blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kadenpriebe.com';

/**
 * Generates an RSS 2.0 feed as a string.
 */
export async function generateRSSFeed(): Promise<string> {
  const posts = await getBlogPosts();
  const buildDate = new Date().toUTCString();

  const items = posts
    .map((post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid>${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description><![CDATA[${post.description}]]></description>
    </item>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kaden Priebe — Random Thoughts</title>
    <link>${SITE_URL}</link>
    <description>Writing about software, biology, and design.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;
}

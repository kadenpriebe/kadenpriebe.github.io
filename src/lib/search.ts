import { getBlogPosts } from './blog';
import { getAllProjects } from './projects';
import { getAllCoursework } from './coursework';

export interface SearchResult {
  title: string;
  description: string;
  slug: string;
  type: 'blog' | 'project' | 'coursework';
}

/**
 * Searches across all blog posts, projects, and coursework.
 * Pure logic, no UI dependencies.
 */
export async function searchAll(query: string): Promise<SearchResult[]> {
  const [blog, projects, coursework] = await Promise.all([
    getBlogPosts(),
    getAllProjects(),
    getAllCoursework(),
  ]);

  const searchResults: SearchResult[] = [
    ...blog.map((post) => ({
      title: post.title,
      description: post.description,
      slug: `/blog/${post.slug}`,
      type: 'blog' as const,
    })),
    ...projects.map((proj) => ({
      title: proj.title,
      description: proj.description,
      slug: `/projects/${proj.slug}`,
      type: 'project' as const,
    })),
    ...coursework.map((course) => ({
      title: course.title,
      description: course.description,
      slug: `/coursework/${course.slug}`,
      type: 'coursework' as const,
    })),
  ];

  if (!query) return searchResults;

  const lowerQuery = query.toLowerCase();
  
  return searchResults.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
  );
}

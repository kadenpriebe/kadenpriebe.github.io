import fs from "fs";
import path from "path";
import matter from "gray-matter";

const COURSEWORK_DIR = path.join(process.cwd(), "content/coursework");

export interface CourseworkMetadata {
  title: string;
  course: string; // e.g., "CS 3780"
  date: string;   // e.g., "2026-02-23"
  description: string;
  slug: string;
}

export interface Coursework {
  metadata: CourseworkMetadata;
  content: string;
}

/**
 * Returns all coursework metadata, sorted by date (newest first).
 */
export async function getAllCoursework(): Promise<CourseworkMetadata[]> {
  if (!fs.existsSync(COURSEWORK_DIR)) {
    return [];
  }

  const files = fs.readdirSync(COURSEWORK_DIR);
  
  const coursework = files
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(COURSEWORK_DIR, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);
      
      return {
        ...data,
        slug: file.replace(/\.mdx?$/, ""),
      } as CourseworkMetadata;
    });

  // Sort by date descending
  return coursework.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Returns the slugs for all coursework posts.
 * Useful for generateStaticParams.
 */
export async function getCourseworkSlugs(): Promise<string[]> {
  if (!fs.existsSync(COURSEWORK_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(COURSEWORK_DIR);
  return files
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

/**
 * Returns the content and metadata for a single coursework post by slug.
 */
export async function getCourseworkBySlug(slug: string): Promise<Coursework | null> {
  // Try .mdx first, then .md
  const extensions = [".mdx", ".md"];
  let filePath = "";

  for (const ext of extensions) {
    const potentialPath = path.join(COURSEWORK_DIR, `${slug}${ext}`);
    if (fs.existsSync(potentialPath)) {
      filePath = potentialPath;
      break;
    }
  }

  if (!filePath) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    metadata: {
      ...data,
      slug,
    } as CourseworkMetadata,
    content,
  };
}

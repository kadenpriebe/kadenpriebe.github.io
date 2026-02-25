import fs from "fs";
import path from "path";
import matter from "gray-matter";

const PROJECTS_DIR = path.join(process.cwd(), "content/projects");

export interface ProjectMetadata {
  title: string;
  date: string;
  description: string;
  tags?: string[];
  link?: string;
  github?: string;
  featured?: boolean;
  slug: string;
}

export interface Project {
  metadata: ProjectMetadata;
  content: string;
}

export async function getAllProjects(): Promise<ProjectMetadata[]> {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(PROJECTS_DIR);
  
  const projects = files
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .map((file) => {
      const filePath = path.join(PROJECTS_DIR, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);
      
      return {
        ...(data as Omit<ProjectMetadata, "slug">),
        slug: file.replace(/\.mdx?$/, ""),
      } as ProjectMetadata;
    });

  // Sort by date descending
  return projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const mdxPath = path.join(PROJECTS_DIR, `${slug}.mdx`);
  const mdPath = path.join(PROJECTS_DIR, `${slug}.md`);
  
  let filePath = "";
  if (fs.existsSync(mdxPath)) {
    filePath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    filePath = mdPath;
  } else {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    metadata: {
      ...(data as Omit<ProjectMetadata, "slug">),
      slug,
    } as ProjectMetadata,
    content,
  };
}

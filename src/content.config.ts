import { defineCollection, z } from "astro:content";
import { glob, file } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: file("./src/content/projects/projects.json"),
  schema: z.object({
    name: z.string(),
    desc: z.string(),
    link: z.string().url(),
  }),
});

export const collections = { blog, projects };

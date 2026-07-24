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

const reading = defineCollection({
  loader: file("./src/content/reading/links.yaml"),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    note: z.string().optional(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, projects, reading };

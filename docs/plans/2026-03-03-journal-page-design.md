# Journal Page Design

## Purpose

Add a separate Journal page for life/personal posts. The blog becomes tech-only, the journal becomes the space for personal writing. The goal: broadcast your frequency, find people who match.

## Decisions

- **Blog** (`/blog`): tech posts only
- **Journal** (`/journal`): life posts only
- **Nav**: Blog | Journal | Projects | About
- **Homepage**: Recent Posts shows tech only
- **Content location**: All posts stay in `src/content/blog/`, filtered by category
- **Schema**: No changes needed, `categories` field already exists

## Changes

### New files

1. `src/pages/journal/index.astro` — Timeline page filtered to `categories.includes("life")`. Title: "Journal". Description: personal/life-focused copy.

2. `src/pages/journal/[slug].astro` — Post page for journal entries, scoped to life category posts.

### Edited files

3. `src/pages/blog/index.astro` — Filter posts to `categories.includes("tech")` only.

4. `src/components/Header.astro` — Add "Journal" nav link between Blog and Projects.

5. `src/pages/index.astro` — Filter Recent Posts to tech category only.

## What doesn't change

- Content schema (`src/content.config.ts`)
- Post file location (`src/content/blog/`)
- Post frontmatter format
- Blog post rendering/layout

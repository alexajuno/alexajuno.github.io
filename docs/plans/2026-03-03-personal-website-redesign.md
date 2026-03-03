# Personal Website Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild alexajuno.github.io from Jekyll + Minima to Astro with a custom modern polished design, deployed on Vercel.

**Architecture:** Astro static site with Tailwind CSS, content collections for blog posts and projects, vanilla JS for interactions. All content is Markdown. Dark/light mode with system preference detection.

**Tech Stack:** Astro, Tailwind CSS, TypeScript, Vercel

---

## Task 1: Initialize Astro Project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`
- Remove: `Gemfile`, `Gemfile.lock`, `_config.yml`, `Dockerfile`, `compose.yaml`, `404.html`, `index.markdown`, `about.markdown`, `favicon.ico`, `_includes/`, `_layouts/`, `_site/`, `.jekyll-cache/`, `assets/main.scss`
- Keep: `_posts/` (needed for migration in Task 4), `docs/`, `.git/`, `.gitignore`, `CLAUDE.md`

**Step 1: Create a new branch**

```bash
cd /home/ajuno/alexajuno.github.io
git checkout -b astro-rebuild
```

**Step 2: Remove Jekyll files**

```bash
rm -rf Gemfile Gemfile.lock _config.yml Dockerfile compose.yaml 404.html index.markdown about.markdown favicon.ico _includes/ _layouts/ _site/ .jekyll-cache/ assets/main.scss
rm -f full-page.png full-page-fixed.png code-block-local.png code-block-fixed.png
```

**Step 3: Initialize Astro with Tailwind**

```bash
npm create astro@latest . -- --template minimal --no-install --typescript strict
npm install
npx astro add tailwind --yes
```

**Step 4: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server at http://localhost:4321 with the minimal template page.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Astro project with Tailwind CSS"
```

---

## Task 2: Base Layout and Theme Toggle

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/ThemeToggle.astro`
- Modify: `src/pages/index.astro`

**Step 1: Create BaseLayout**

`src/layouts/BaseLayout.astro` — the shell used by every page:
- `<html>` with `lang="en"` and a `class` attribute for dark mode
- `<head>` with Inter font from Google Fonts, meta viewport, title prop
- `<body>` wrapping `<Header />`, `<slot />`, `<Footer />`
- Inline script in `<head>` that reads `localStorage.theme` or `prefers-color-scheme` and sets `dark` class on `<html>` before paint (prevents flash)

**Step 2: Create Header**

`src/components/Header.astro`:
- Site title "alexajuno" linking to `/`
- Nav links: Blog (`/blog`), Projects (`/projects`), About (`/about`)
- `<ThemeToggle />` component
- Responsive: hamburger menu on mobile (vanilla JS toggle)
- Sticky header with subtle backdrop blur

**Step 3: Create ThemeToggle**

`src/components/ThemeToggle.astro`:
- Button with sun/moon icon (inline SVG, no icon library)
- `<script>` that toggles `dark` class on `<html>` and persists to `localStorage`

**Step 4: Create Footer**

`src/components/Footer.astro`:
- GitHub and Twitter/X links (using your usernames: alexajuno, giolynx104)
- Copyright line

**Step 5: Wire up index.astro**

Replace `src/pages/index.astro` to use `<BaseLayout>` with a placeholder "Hello" to verify layout renders.

**Step 6: Verify**

```bash
npm run dev
```

Check: header with nav links, theme toggle works, footer visible. Dark/light switch persists on refresh.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add base layout with header, footer, and theme toggle"
```

---

## Task 3: Home Page

**Files:**
- Modify: `src/pages/index.astro`

**Step 1: Build the hero section**

- Large heading: "Hi, I'm Giao" (or preferred intro)
- Short tagline/bio (1-2 sentences)
- Two CTA links: "Read the blog" → `/blog`, "See projects" → `/projects`
- Subtle gradient accent on the heading or background

**Step 2: Add a "Recent Posts" section below the hero**

- Show latest 3 blog posts (title + date, linking to the post)
- This will use a hardcoded placeholder list for now — wired to real content in Task 4

**Step 3: Verify**

```bash
npm run dev
```

Check: hero renders, CTAs link correctly, responsive on mobile.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add home page with hero and recent posts section"
```

---

## Task 4: Blog Content Collection and Migration

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/blog/` (directory with migrated posts)
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[slug].astro`
- Remove: `_posts/` (after migration)

**Step 1: Define the blog content collection**

`src/content.config.ts`:

```typescript
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
  }),
});

export const collections = { blog };
```

**Step 2: Migrate posts**

Move 11 posts from `_posts/` to `src/content/blog/`. For each post:
- Strip the `YYYY-MM-DD-` date prefix from filename (Astro uses frontmatter date, not filename)
- Remove `layout: post` from frontmatter (Astro uses its own layout system)
- Normalize `categories`: some posts use `categories: tech`, others `categories: [tech]` — standardize to array format `categories: [tech]`
- Add `description` field to frontmatter (first ~150 chars of content, for SEO/previews)
- Remove the duplicate `# Title` heading from the body of the oldest post (2025-06-05)

**Step 3: Verify content collection loads**

```bash
npm run build
```

Expected: builds without errors, all 11 posts recognized.

**Step 4: Create blog listing page**

`src/pages/blog/index.astro`:
- Query all blog posts via `getCollection("blog")`
- Sort by date descending
- Render each as a card: title, date, tags, description snippet
- Use `<BaseLayout>`

**Step 5: Create blog post page**

`src/pages/blog/[slug].astro`:
- `getStaticPaths()` generates a path per post
- Renders post content with `<Content />` component
- Uses `<BaseLayout>` with post title
- Styled prose (Tailwind Typography plugin — `@tailwindcss/typography`)

```bash
npm install @tailwindcss/typography
```

**Step 6: Wire home page recent posts**

Update `src/pages/index.astro` to query real posts instead of placeholders.

**Step 7: Remove old `_posts/` directory**

```bash
rm -rf _posts/
```

**Step 8: Verify**

```bash
npm run dev
```

Check: `/blog` lists all 11 posts sorted by date. Clicking a post shows full content with styled code blocks. Home page shows latest 3.

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add blog content collection and migrate 11 posts from Jekyll"
```

---

## Task 5: Projects Content Collection and Page

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/projects/` (directory)
- Create: `src/content/projects/jamc.md` (and other project files)
- Create: `src/pages/projects/index.astro`

**Step 1: Add projects collection to content config**

Add to `src/content.config.ts`:

```typescript
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    github: z.string().url().optional(),
    live: z.string().url().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { blog, projects };
```

**Step 2: Create project entries**

Based on blog post references, create Markdown files for at least these projects:
- `jamc.md` — Q&A platform (referenced in retrospective post)
- `bridz.md` — Customer feedback platform (multiple posts reference it)

Each file has frontmatter matching the schema + a short description body (2-3 paragraphs about the project).

**USER CONTRIBUTION:** The user should write the project descriptions and decide which projects to include, what tech to list, and what links to provide. Prepare the files with frontmatter and a `<!-- Write your project description here -->` placeholder.

**Step 3: Create projects listing page**

`src/pages/projects/index.astro`:
- Query `getCollection("projects")`, sort by `order`
- Render as a card grid: title, description, tech stack pills, GitHub/live links
- Use `<BaseLayout>`

**Step 4: Verify**

```bash
npm run dev
```

Check: `/projects` renders project cards. Tech stack shows as pills/badges.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add projects content collection and page"
```

---

## Task 6: About Page

**Files:**
- Create: `src/pages/about.astro`

**Step 1: Create the about page**

`src/pages/about.astro`:
- Uses `<BaseLayout>`
- Heading: "About"
- Content: Start with the existing line "Hi, I'm Giao, a developer. Nice to meet you" and expand
- Sections: short bio, what you're working on, how to reach you (GitHub, email, Twitter/X)

**USER CONTRIBUTION:** The user should write the actual about content. Prepare the page structure with placeholder sections.

**Step 2: Verify**

```bash
npm run dev
```

Check: `/about` renders with layout, nav highlights current page.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add about page"
```

---

## Task 7: Visual Polish — Typography, Colors, Animations

**Files:**
- Modify: `tailwind.config.mjs` (or `astro.config.mjs` Tailwind config)
- Create: `src/styles/global.css`
- Modify: various components for animation classes

**Step 1: Set up design tokens**

In Tailwind config, extend the theme:
- Custom color palette with a primary accent (gradient-friendly)
- Font family: Inter (already loaded in BaseLayout)
- Extend with subtle box shadows, border radius presets

**Step 2: Create global styles**

`src/styles/global.css`:
- Base styles for dark/light mode color variables
- Prose styling overrides for blog posts (code blocks, links, headings)
- Smooth scroll behavior

**Step 3: Add scroll-triggered fade-in animations**

Create a reusable approach:
- CSS `@keyframes fade-in-up` animation
- A small inline `<script>` using `IntersectionObserver` to add `.animate` class when elements enter viewport
- Apply to: home hero, blog post cards, project cards

**Step 4: Add hover effects**

- Blog/project cards: subtle lift + shadow on hover
- Nav links: underline animation
- CTA buttons: gradient shift on hover

**Step 5: Verify**

```bash
npm run dev
```

Check: animations trigger on scroll, hover effects work, dark/light mode colors are consistent, typography looks polished.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add visual polish — typography, colors, and animations"
```

---

## Task 8: SEO and Meta Tags

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Step 1: Add meta tags to BaseLayout**

- `<title>` from page prop, fallback to "alexajuno"
- `<meta name="description">` from page prop
- Open Graph tags: `og:title`, `og:description`, `og:type`, `og:url`
- Twitter card meta tags
- Canonical URL
- Favicon (create a simple one or use an emoji favicon)

**Step 2: Pass SEO props from each page**

Each page passes `title` and `description` to `<BaseLayout>`. Blog posts use their frontmatter title/description.

**Step 3: Verify**

```bash
npm run build
```

Inspect the built HTML to confirm meta tags render correctly.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add SEO meta tags and open graph support"
```

---

## Task 9: Update CLAUDE.md and Gitignore

**Files:**
- Modify: `CLAUDE.md`
- Modify: `.gitignore`

**Step 1: Update CLAUDE.md**

Replace Jekyll-specific content with Astro equivalents:
- Commands: `npm run dev` for local server, `npm run build` for production build
- Content location: `src/content/blog/` and `src/content/projects/`
- Keep the writing style guide (it's good)
- Update post conventions for Astro frontmatter format

**Step 2: Update .gitignore**

Replace with Astro-appropriate ignores:
```
node_modules/
dist/
.astro/
.vercel/
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: update CLAUDE.md and .gitignore for Astro"
```

---

## Task 10: Vercel Deployment

**Step 1: Install Vercel adapter**

```bash
npx astro add vercel --yes
```

This updates `astro.config.mjs` to use the Vercel adapter.

**Step 2: Verify production build**

```bash
npm run build
```

Expected: builds to `.vercel/output/` without errors.

**Step 3: Deploy**

- Push the `astro-rebuild` branch to GitHub
- Connect the repo to Vercel via vercel.com (or `npx vercel`)
- Set production branch to `astro-rebuild` (or merge to `main` first)
- Vercel auto-detects Astro and deploys

**Step 4: Verify live site**

Check the Vercel preview URL. All pages render, dark mode works, blog posts display correctly.

**Step 5: Commit any config changes**

```bash
git add -A
git commit -m "feat: add Vercel deployment adapter"
```

---

## Post-Completion

After all tasks:
1. Merge `astro-rebuild` into `main`
2. Set up custom domain on Vercel if desired
3. User fills in project descriptions and about page content

# Personal Website Redesign

## Decision

Rebuild alexajuno.github.io from Jekyll + Minima to Astro with a custom modern polished design. Deploy on Vercel.

## Motivation

The current Jekyll site with Minima theme looks generic. Goal is a site with personality that serves as both blog and portfolio.

## Tech Stack

- **Astro** — static site generator, Markdown-first, zero JS by default
- **Tailwind CSS** — utility-first styling
- **Vanilla JS** — small interactions (scroll animations, theme toggle)
- **Vercel** — deployment with preview deploys on PRs
- **Content Collections** — Astro's built-in typed Markdown management

## Pages

- **Home** (`/`) — Hero with name, tagline, links to blog + projects
- **Blog** (`/blog`) — Post list sorted by date
- **Blog Post** (`/blog/[slug]`) — Individual posts
- **Projects** (`/projects`) — Card grid of projects
- **About** (`/about`) — Bio, interests, contact info

## Design Direction

- Clean sans-serif typography (Inter or similar)
- Subtle gradient accents (hero, hover states)
- Scroll-triggered animations (fade-in, slide-up) via CSS or lightweight lib
- Dark/light mode toggle
- Generous whitespace, clear hierarchy
- Responsive via Tailwind

## Content Migration

- 11 existing Markdown posts move to `src/content/blog/` with minor frontmatter adjustments
- Astro content collections validate frontmatter at build time
- Existing categories and tags carry over

## Project Entries

- Markdown files in `src/content/projects/`
- Fields: title, description, tech stack, links (GitHub, live demo), optional screenshot
- Rendered as cards on `/projects`

## Out of Scope

- Contact form
- Resume download
- Newsletter signup
- CMS / admin panel

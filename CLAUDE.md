# Blog Guide

## Commands

`npm run dev` - Local dev server (http://localhost:4321) with live reload
`npm run build` - Production build

## Content

- Blog posts: `src/content/blog/`
- Projects: `src/content/projects/`

## Writing Style

- Conversational, thinking-out-loud tone. Not polished or formal.
- Short sentences. Fragment sentences are fine.
- No em dashes (`—`). Use periods or commas instead.
- Honest about not understanding things. "I didn't fully understand" is better than pretending.
- Casual transitions: "Nice.", "Long wait.", "Almost forgot."
- No summary/conclusion sections that repeat what was already said.
- Code examples when relevant, but don't overload.
- Posts come from real experience building things, not tutorials.

## Post Conventions

- Filename: `slug.md` (descriptive name only, no date prefix; the date lives in frontmatter)
- Frontmatter fields: title, date, description
- Don't add `# Title` heading in post content. Title is rendered from frontmatter.

## Git

- Commit directly to `main`. Don't branch first, and don't suggest branching.
- **Why:** this is a solo personal site with no review flow, so a branch-and-PR step is pure overhead. This overrides the default "branch when on the default branch" behavior.

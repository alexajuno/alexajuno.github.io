# Clickable Tags with Tag Pages

## Summary

Make blog/journal tags clickable links that navigate to per-tag pages listing all matching posts.

## Pages

### /tags (index)
- Lists all tags as clickable badges with post counts
- Sorted alphabetically
- Uses existing site layout

### /tags/[tag] (detail)
- Generated statically via `getStaticPaths()`
- Shows all posts (blog + journal) matching the tag
- Timeline layout matching blog/journal index pages
- Each post labeled with its section (blog/journal)
- Sorted by date descending

## Changes to Existing Components

- `PostFooter.astro`: Wrap tag badges in `<a href="/tags/{tag}">`
- `blog/index.astro`: Wrap tag badges in links
- `journal/index.astro`: Wrap tag badges in links

## No Changes

- No new nav items
- No client-side JS
- No schema changes (tags already defined in content config)

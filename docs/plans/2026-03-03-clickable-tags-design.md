# Clickable Tags Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make tags clickable links to per-tag pages that list all matching posts from blog and journal.

**Architecture:** Static tag pages generated with Astro's `getStaticPaths()`. Tags in post detail views become `<a>` links. Tags in list views stay as plain badges (they're inside card `<a>` wrappers, nesting anchors is invalid HTML).

**Tech Stack:** Astro static pages, Tailwind CSS

---

### Task 1: Create /tags/[tag].astro (per-tag page)

**Files:**
- Create: `src/pages/tags/[tag].astro`

**Step 1: Create the tag detail page**

Uses `getStaticPaths()` to collect all unique tags across all posts, then generates a page per tag showing matching posts sorted by date descending. Each post shows a section label (blog/journal) and links to the correct section.

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  const tagMap = new Map<string, typeof posts>();

  for (const post of posts) {
    for (const tag of post.data.tags) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(post);
    }
  }

  return [...tagMap.entries()].map(([tag, posts]) => ({
    params: { tag },
    props: {
      tag,
      posts: posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()),
    },
  }));
}

const { tag, posts } = Astro.props;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getSection(post: (typeof posts)[number]) {
  return post.data.categories.includes("tech") ? "blog" : "journal";
}
---

<BaseLayout title={`#${tag} — alexajuno`} description={`Posts tagged "${tag}"`}>
  <section class="pt-8 pb-8 sm:pt-12 sm:pb-10">
    <a
      href="/tags"
      class="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      All tags
    </a>
    <h1 class="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">#{tag}</h1>
    <p class="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
      {posts.length} {posts.length === 1 ? "post" : "posts"}
    </p>
  </section>

  <ul class="space-y-3">
    {posts.map((post) => {
      const section = getSection(post);
      return (
        <li>
          <a
            href={`/${section}/${post.id}`}
            class="animate-fade-in-up card-hover group block rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                {section}
              </span>
              <time
                datetime={post.data.date.toISOString()}
                class="text-sm text-zinc-500 dark:text-zinc-500"
              >
                {formatDate(post.data.date)}
              </time>
            </div>
            <h4 class="mt-2 text-lg font-semibold text-zinc-900 transition-colors group-hover:text-accent-600 dark:text-zinc-100 dark:group-hover:text-accent-400">
              {post.data.title}
            </h4>
            {post.data.description && (
              <p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {post.data.description}
              </p>
            )}
          </a>
        </li>
      );
    })}
  </ul>
</BaseLayout>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Builds without errors, generates `/tags/<tag>/index.html` for each tag.

**Step 3: Commit**

```bash
git add src/pages/tags/[tag].astro
git commit -m "add per-tag page with post listing"
```

---

### Task 2: Create /tags/index.astro (tag index)

**Files:**
- Create: `src/pages/tags/index.astro`

**Step 1: Create the tags index page**

Lists all tags alphabetically with post counts. Tags are clickable badges linking to `/tags/[tag]`.

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

const posts = await getCollection("blog");
const tagCounts = new Map<string, number>();

for (const post of posts) {
  for (const tag of post.data.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  }
}

const tags = [...tagCounts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
---

<BaseLayout title="Tags — alexajuno" description="Browse posts by tag.">
  <section class="pt-8 pb-8 sm:pt-12 sm:pb-10">
    <h1 class="animate-fade-in-up text-4xl font-bold tracking-tight sm:text-5xl">Tags</h1>
    <p class="animate-fade-in-up delay-100 mt-4 text-lg text-zinc-600 dark:text-zinc-400">
      {tags.length} {tags.length === 1 ? "tag" : "tags"}
    </p>
  </section>

  <div class="animate-fade-in-up flex flex-wrap gap-3">
    {tags.map(([tag, count]) => (
      <a
        href={`/tags/${tag}`}
        class="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
      >
        {tag}
        <span class="text-xs text-zinc-400 dark:text-zinc-500">{count}</span>
      </a>
    ))}
  </div>
</BaseLayout>
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Builds without errors, generates `/tags/index.html`.

**Step 3: Commit**

```bash
git add src/pages/tags/index.astro
git commit -m "add tags index page"
```

---

### Task 3: Make tags clickable in PostFooter

**Files:**
- Modify: `src/components/PostFooter.astro:15-18`

**Step 1: Update tag spans to anchor links**

Change the `<span>` tags to `<a>` links pointing to `/tags/{tag}`.

Before:
```astro
<span class="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
  {tag}
</span>
```

After:
```astro
<a href={`/tags/${tag}`} class="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200">
  {tag}
</a>
```

**Step 2: Verify visually**

Run: `npm run dev`
Visit a blog post with tags. Verify tags look the same but are clickable and navigate to `/tags/<tag>`.

**Step 3: Commit**

```bash
git add src/components/PostFooter.astro
git commit -m "make post footer tags clickable"
```

---

### Task 4: Make tags clickable in journal post header

**Files:**
- Modify: `src/pages/journal/[slug].astro:63-67`

**Step 1: Update tag spans to anchor links**

Same change as PostFooter but with the journal header tag style.

Before:
```astro
<span class="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
  {tag}
</span>
```

After:
```astro
<a href={`/tags/${tag}`} class="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700">
  {tag}
</a>
```

**Step 2: Verify visually**

Run: `npm run dev`
Visit a journal post with tags. Verify tags are clickable.

**Step 3: Commit**

```bash
git add src/pages/journal/[slug].astro
git commit -m "make journal post tags clickable"
```

---

### Task 5: Final verification

**Step 1: Full build check**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 2: Manual verification**

Run: `npm run dev`
Verify:
- `/tags` shows all tags with counts
- `/tags/<tag>` shows matching posts with blog/journal labels
- Blog post footer tags link to `/tags/<tag>`
- Journal post header tags link to `/tags/<tag>`
- Blog/journal list page tags remain plain badges (no broken nested links)

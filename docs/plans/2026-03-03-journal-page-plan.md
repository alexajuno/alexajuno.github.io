# Journal Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split the blog into tech-only /blog and life-only /journal, add Journal to nav.

**Architecture:** All posts stay in `src/content/blog/`. Pages filter by `categories` field. Journal pages are independent copies of blog pages with category filter and adjusted copy.

**Tech Stack:** Astro, TypeScript, Tailwind CSS

---

### Task 1: Filter blog index to tech-only

**Files:**
- Modify: `src/pages/blog/index.astro:5-7`

**Step 1: Add category filter to blog page**

In `src/pages/blog/index.astro`, change the posts query from:

```typescript
const posts = (await getCollection("blog")).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime()
);
```

to:

```typescript
const posts = (await getCollection("blog"))
  .filter((post) => post.data.categories.includes("tech"))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds. The "What Do I Do Next?" post (life category) should not appear on the blog page.

**Step 3: Commit**

```bash
git add src/pages/blog/index.astro
git commit -m "filter blog index to tech posts only"
```

---

### Task 2: Filter blog slug page to tech-only

**Files:**
- Modify: `src/pages/blog/[slug].astro:5-8`

**Step 1: Scope getStaticPaths to tech posts**

In `src/pages/blog/[slug].astro`, change:

```typescript
export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

to:

```typescript
export async function getStaticPaths() {
  const posts = (await getCollection("blog")).filter((post) =>
    post.data.categories.includes("tech")
  );
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds. `/blog/what-to-do-next` should no longer be generated.

**Step 3: Commit**

```bash
git add src/pages/blog/[slug].astro
git commit -m "scope blog slug routes to tech posts only"
```

---

### Task 3: Create journal index page

**Files:**
- Create: `src/pages/journal/index.astro`

**Step 1: Create journal index**

Create `src/pages/journal/index.astro` with the same structure as `src/pages/blog/index.astro` but:
- Filter to `categories.includes("life")` instead of `"tech"`
- Title: `"Journal — alexajuno"`
- Description: `"Thoughts on life, figuring things out, and whatever's on my mind."`
- Page heading: `"Journal"`
- Subheading: `"Thoughts on life, figuring things out, and whatever's on my mind."`
- Post links point to `/journal/${post.id}` instead of `/blog/${post.id}`

Full file:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection } from "astro:content";

const posts = (await getCollection("blog"))
  .filter((post) => post.data.categories.includes("life"))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

type Post = (typeof posts)[number];
type MonthGroup = { month: string; posts: Post[] };
type YearGroup = { year: number; count: number; months: MonthGroup[] };

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const timeline: YearGroup[] = [];
let currentYear: YearGroup | null = null;
let currentMonth: MonthGroup | null = null;

for (const post of posts) {
  const year = post.data.date.getFullYear();
  const month = monthNames[post.data.date.getMonth()];

  if (!currentYear || currentYear.year !== year) {
    currentYear = { year, count: 0, months: [] };
    currentMonth = null;
    timeline.push(currentYear);
  }

  if (!currentMonth || currentMonth.month !== month) {
    currentMonth = { month, posts: [] };
    currentYear.months.push(currentMonth);
  }

  currentMonth.posts.push(post);
  currentYear.count++;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
---

<BaseLayout title="Journal — alexajuno" description="Thoughts on life, figuring things out, and whatever's on my mind.">
  <section class="pt-8 pb-8 sm:pt-12 sm:pb-10">
    <h1 class="animate-fade-in-up text-4xl font-bold tracking-tight sm:text-5xl">Journal</h1>
    <p class="animate-fade-in-up delay-100 mt-4 max-w-lg text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
      Thoughts on life, figuring things out, and whatever's on my mind.
    </p>
  </section>

  <div class="relative space-y-10 pl-6 sm:pl-8">
    {/* Timeline line */}
    <div class="absolute top-2 bottom-0 left-[7px] w-px bg-zinc-200 sm:left-[11px] dark:bg-zinc-800" />

    {
      timeline.map((yearGroup) => (
        <section class="relative">
          <div class="animate-fade-in-up relative mb-6 flex items-center gap-3">
            <div class="absolute -left-6 flex h-4 w-4 items-center justify-center sm:-left-8 sm:h-6 sm:w-6">
              <div class="h-3 w-3 rounded-full border-2 border-zinc-400 bg-white sm:h-3.5 sm:w-3.5 dark:border-zinc-500 dark:bg-zinc-950" />
            </div>
            <h2 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {yearGroup.year}
            </h2>
            <span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {yearGroup.count} {yearGroup.count === 1 ? "post" : "posts"}
            </span>
          </div>

          <div class="space-y-8">
            {yearGroup.months.map((monthGroup) => (
              <div class="relative">
                <div class="animate-fade-in-up relative mb-3 flex items-center gap-2">
                  <div class="absolute -left-6 flex h-4 w-4 items-center justify-center sm:-left-8 sm:h-6 sm:w-6">
                    <div class="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                  </div>
                  <h3 class="text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                    {monthGroup.month}
                  </h3>
                </div>

                <ul class="space-y-3">
                  {monthGroup.posts.map((post) => (
                    <li>
                      <a
                        href={`/journal/${post.id}`}
                        class="animate-fade-in-up card-hover group block rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                      >
                        <h4 class="text-lg font-semibold text-zinc-900 transition-colors group-hover:text-accent-600 dark:text-zinc-100 dark:group-hover:text-accent-400">
                          {post.data.title}
                        </h4>
                        <time
                          datetime={post.data.date.toISOString()}
                          class="mt-1 block text-sm text-zinc-500 dark:text-zinc-500"
                        >
                          {formatDate(post.data.date)}
                        </time>
                        {post.data.description && (
                          <p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {post.data.description}
                          </p>
                        )}
                        {post.data.tags.length > 0 && (
                          <div class="mt-3 flex flex-wrap gap-2">
                            {post.data.tags.map((tag: string) => (
                              <span class="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))
    }
  </div>
</BaseLayout>
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds. Journal page is generated with the "What Do I Do Next?" post.

**Step 3: Commit**

```bash
git add src/pages/journal/index.astro
git commit -m "add journal index page for life posts"
```

---

### Task 4: Create journal slug page

**Files:**
- Create: `src/pages/journal/[slug].astro`

**Step 1: Create journal post page**

Create `src/pages/journal/[slug].astro` — same as `src/pages/blog/[slug].astro` but:
- Filter to `categories.includes("life")`
- Back link points to `/journal` with text "Back to journal"

Full file:

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const posts = (await getCollection("blog")).filter((post) =>
    post.data.categories.includes("life")
  );
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
---

<BaseLayout title={`${post.data.title} — alexajuno`} description={post.data.description} ogType="article">
  <article>
    <header class="pb-8">
      <a
        href="/journal"
        class="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <svg
          class="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"></path>
        </svg>
        Back to journal
      </a>

      <h1 class="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        {post.data.title}
      </h1>

      <div class="mt-4 flex flex-wrap items-center gap-4">
        <time
          datetime={post.data.date.toISOString()}
          class="text-sm text-zinc-500 dark:text-zinc-500"
        >
          {formatDate(post.data.date)}
        </time>
        {post.data.tags.length > 0 && (
          <div class="flex flex-wrap gap-2">
            {post.data.tags.map((tag: string) => (
              <span class="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>

    <div class="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-accent-600 prose-a:no-underline hover:prose-a:underline dark:prose-a:text-accent-400">
      <Content />
    </div>
  </article>
</BaseLayout>
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds. `/journal/what-to-do-next` is generated.

**Step 3: Commit**

```bash
git add src/pages/journal/[slug].astro
git commit -m "add journal post page for life entries"
```

---

### Task 5: Add Journal to navigation

**Files:**
- Modify: `src/components/Header.astro:4-8`

**Step 1: Add Journal nav link**

In `src/components/Header.astro`, change the `navLinks` array from:

```typescript
const navLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];
```

to:

```typescript
const navLinks = [
  { href: "/blog", label: "Blog" },
  { href: "/journal", label: "Journal" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];
```

**Step 2: Verify**

Run: `npm run dev` and check that "Journal" appears in the nav bar between Blog and Projects, on both desktop and mobile menu.

**Step 3: Commit**

```bash
git add src/components/Header.astro
git commit -m "add Journal to navigation"
```

---

### Task 6: Filter homepage recent posts to tech-only

**Files:**
- Modify: `src/pages/index.astro:5-7`

**Step 1: Add category filter to homepage**

In `src/pages/index.astro`, change:

```typescript
const allPosts = (await getCollection("blog")).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime()
);
```

to:

```typescript
const allPosts = (await getCollection("blog"))
  .filter((post) => post.data.categories.includes("tech"))
  .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
```

**Step 2: Verify**

Run: `npm run build`
Expected: Build succeeds. Homepage recent posts show only tech posts.

**Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "filter homepage recent posts to tech only"
```

---

### Task 7: Final verification

**Step 1: Full build check**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 2: Manual smoke test**

Run: `npm run dev` and verify:
- `/blog` shows only tech posts (no "What Do I Do Next?")
- `/journal` shows only life posts ("What Do I Do Next?" appears)
- `/journal/what-to-do-next` renders correctly with "Back to journal" link
- `/blog/what-to-do-next` returns 404
- Nav shows: Blog | Journal | Projects | About
- Homepage recent posts are tech-only
- Mobile menu includes Journal link

---
layout: post
title: "Building a Trending Algorithm for a Feedback Platform"
date: 2026-02-24
categories: [tech]
tags: [algorithm, laravel, bridz]
---

This is another post in the Bridz series. This time about the journey of building a trending algorithm for a customer feedback platform.

## First Approach: Hacker News Formula

Bridz has a "trending" sort for feedback posts. The first approach was a Hacker News-style formula: `score^0.8 / (2 + hours)^1.8`. It decays posts based on how old they are. Works great for HN where content cycles hourly. Not so great for a feedback platform.

The issue is subtle. HN's formula uses **post creation time** for decay. On HN that makes sense, a link posted 3 days ago is stale. But feedback posts aren't like links. A feature request created 6 months ago can suddenly get a wave of votes because a competitor shipped something similar. With the HN formula, that post would never trend no matter how many votes it gets, because it's "old."

## Researching Alternatives

I looked at what others do. Reddit Hot uses post creation time too, same fundamental problem. Wilson Score focuses on confidence intervals for up/down vote ratios, but we only have upvotes. Bayesian averages are for ratings, not votes.

Then I looked at what Canny (the product we're replacing) actually does. Their trending description says "which posts have gotten the most votes recently." That's it. Vote velocity. Count the votes in a recent window.

Sometimes the boring answer is the right one.

## The Design

Count votes cast in the last 30 days per post. Order by that count descending. Filter out zero-vote posts and completed/closed ones.

```sql
SELECT posts.*,
  (SELECT COUNT(*) FROM votes
   WHERE votes.post_id = posts.id
   AND votes.created_at > NOW() - INTERVAL '30 days'
  ) as recent_votes
FROM posts
WHERE score > 0 AND status NOT IN ('complete', 'closed')
ORDER BY recent_votes DESC, score DESC, created_at DESC
```

The tiebreaker matters. When two posts have the same recent vote count, fall back to total score, then creation date. During quiet periods when nobody has recent votes, trending degrades gracefully into "top" sort. That's the best you can do without velocity data.

Why 30 days? A 7-day window is too spiky. A 90-day window blurs the signal. 30 days felt right for feedback platforms where voting patterns are slower than social media but faster than annual surveys.

## The Controller Bug

Here's the fun part. I deployed, tested in the browser, saw zero-vote posts gone, ordering makes sense. Then I tried the public API endpoint via curl. Same old behavior. Zero-vote posts still showing up.

Turns out we have three separate controller layers serving the same data:

1. Storefront controller, what end users see in the browser
2. Admin controller, the dashboard
3. Public API v1 controller, for external integrations

The trending logic lived in a shared service. The storefront and admin controllers called the service. The public API controller? It had its own inline sort logic that nobody updated. A `match` statement with cases for `'top'` and `'new'`, and trending just fell through to the default case (newest first).

Classic. We shipped a fix, updated the algorithm, tested it, and it worked. In 2 out of 3 places.

The real lesson isn't "check all controllers." It's that business logic shouldn't live in controllers at all. Controllers should be thin wrappers that call shared services. If the trending logic had been in the service from the start (it was, but the V1 controller predated it), this wouldn't have happened.

## The Canny Import Problem

There's one more thing worth mentioning. When we import data from Canny, we get total vote counts but not individual vote records. Canny's export doesn't include per-vote timestamps. So right after a Canny import, every post has `recent_votes = 0` because there are no vote records in our database.

We considered faking it, creating synthetic vote records spread across the import date. But that felt wrong. Fake data pollutes the database, affects voter lists and activity feeds, and creates an artificial trending spike that all drops off after 30 days.

Instead, we just let trending degrade to "top" sort when there's no velocity data. It's honest. And it self-corrects. As users start voting on the new platform, trending starts working naturally.

## Takeaways

Don't copy algorithms without understanding the problem they were designed for. HN's formula is elegant for a news aggregator. It's wrong for a feedback platform.

When you have multiple API surfaces serving the same data, put the logic in a service. Not in the controller. Especially not copy-pasted across controllers.

And sometimes the boring solution, just count recent votes, is exactly right.

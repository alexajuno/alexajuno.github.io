---
layout: post
title: "Building a Simple Full-Text Search Feature"
date: 2025-07-28 00:10:57 +0700
categories: tech
---

# Building a Simple Yet Scalable Full-Text Search Feature

Recently, I built a simple full-text search feature for an app, and I thought it might be fun to share some of the challenges, decisions, and insights along the way.

The first major decision was choosing the right search engine. There were several good options: Elasticsearch, Typesense, Algolia, and MeiliSearch. Given the simplicity of our initial needs, our desire for self-hosting, and the expectation of future scalability and additional features, Typesense emerged as the clear winner.

Typesense's concepts are similar to MongoDB, involving ideas like clusters, collections, and documents. It supports multiple search types, including multi-search in union or federated modes, as well as single-collection search. Initially, I envisioned users selecting multiple collections at once, alternating between federated search for specific collections and union search for the 'All' mode. However, I quickly discovered this approach was cumbersome from a user experience perspective—selecting and deselecting multiple categories felt clunky. Ultimately, simplicity won out, and I streamlined the system to allow searching one category at a time, primarily utilizing the union mode.

Another critical aspect was access management. There were two main approaches. If the frontend wants to query Typesense directly, we could use its scoped API key system to enforce per-user access control. However, in our case, the backend already implemented a robust multi-tenancy model. So instead, we filtered results by organization_id using the filter_by parameter, while leveraging the backend's existing access scopes to determine what each staff member could see.

Both methods are valid depending on the architecture. Looking back, I’m not entirely sure why I went with the latter—perhaps I hadn’t fully weighed the trade-offs at the time. Initially, I mistakenly tried to use both systems in tandem, but later on, people realized that was redundant. In the end, it was simplified by removing the scoped API keys and relying solely on the backend's access control logic, since this approach is faster than querying Typesense with a scoped API key and avoids additional code complexity.

Regarding deployment, although cloud services generally provide convenience and reliability, for this relatively new and optional feature, we chose self-hosting. Our setup is intentionally simple compared to Typesense's extensive deployment guidelines. As long as we manage our hosting responsibly, this approach shouldn't introduce major issues.

The search history feature presented an interesting dilemma. Initially, I considered using a longer debounce period (600ms–1s) to trigger search execution and history recording. However, this method was problematic—choosing the correct debounce timing was challenging, and it often resulted in unwanted history entries, especially in no-result scenarios. Ultimately, I opted for a simpler solution: saving search history only when users explicitly select a result.

Building this feature for a production application was enlightening. I learned firsthand that building the core functionality is just the beginning. Significant refinement, particularly in UX and UI, doubled the initially estimated timeline—from two weeks to nearly a month.

At the time of writing, the feature has yet to be deployed, so some unexpected challenges might still arise. Nonetheless, I hope this glimpse into the practical realities of implementing full-text search has provided insights beyond the documentation.

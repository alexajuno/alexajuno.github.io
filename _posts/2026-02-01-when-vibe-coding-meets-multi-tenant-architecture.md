---
layout: post
title: "When Vibe Coding Meets Multi-Tenant Architecture"
date: 2026-02-01
categories: [tech]
tags: [vibe-coding, architecture, deployment]
---

Recently Canny.io increased their pricing so we decided to vibe code an internal tool for customer feedback management for our products. It's coming to an mvp and well, it's been a while since my last writing so I think this is a good time to share some thoughts.

It's first time receiving investment into infrastructure, from the company for my craft. So it's honestly a real product that I completely in control from front to back. I'm happy about the learning opportunity in this project.

In the beginning, we intended to go extremely fast with pure vibe coding. The early results taught us that AI tools excel at scaffolding but struggle with coherent architecture across a large codebase. Some tools generate excessive markdown files for context, which becomes a maintenance burden when you need minor changes later. We realized that fully vibe-coding a product of this scale leads to scattered design decisions and technical debt. So AI works best when you stay in the driver's seat. We should never expect a tool to code the whole product for us. We have to be the navigator, even in the smallest details, since AI doesn't understand the world the way we do. I think of it as "the echo of humanity.", or as Andrej Karpathy calls them "ghosts". Ghosts whisper next to your ears but can't replace your decision. Vibe coding works well for frontend scaffolding, but once you hit backend integration, you need to slow down and ensure coherent architecture.

Let's discuss the architecture. We have multiple components in a system like this. We have Laravel backend, multiple repos for frontend including admin page (admin facing), app page (customer facing), embed widget for host app.

First, since posts in a customer feedback management (CFM) is public facing, you definitely want to use slug here. But at the same time, querying slug is slow, so I used id for non-public facing queries for non-get actions (i.e. post, put).

Talking about id, here I used ULID for most objects. Why ulid? We don't want incremental to avoid data leak, someone can try the id and guess the number of stuffs we have like users, posts, etc. Comparing to other versions of uuid, popular options like v4 or v7, ulid is shorter, sortable with time section in its prefix.

The next thing is about architecture is subdomain for workspaces. People would want `{workspace}.appname.io` right? For branding sake. So this affects the whole design of the system, creating bunch of problems that's different from pure approaches without that.

The first related problem is resolving subdomain from an url. In local development, somehow when I'm working with Laravel for backend, it can't save the cookie for first-party authn for `localhost`. I had to use `lvh.me` and it worked. It's a weird problem for local dev.

Another huge problem is deployment. We used Digital Ocean App Platform for hosting, and actually, everything was just fine with path resolve until there is another component appears: that's is the marketing pages. At first, things are `appname.io` with path for `/admin`, `/embed`, root `/` for main app. But having market page, it will be placed directly at root too `/`, and this causes problem for routing, in which taking precendence over the path of other components. We had a headache of this for a while. At first, we thought that trying to be a normal app again, with subdomain for components, like `api.appname.io`, `admin.appname.io`, etc. but this won't work with subdomain for workspaces, since the whole request flow was designed for path resolve and it goes like `{workspace}.appname.io/admin`, to `{workspace}.appname.io/api`, and api receives the whole url with subdomain included. Moving to `api.` requires a huge change in code, and I can't bear this. So after a while in weekend, playing around with config, I found a solution using authority config in Digital Ocean App Spec. The authority field lets you match requests based on the exact hostname. By adding `authority: exact: appname.io` to the homepage and related root-domain rules, those rules only match the root domain. Then I duplicated the rules for /admin, /api, etc. without the authority field, these will help with catch all workspace subdomain requests like {workspace}.appname.io/admin. This way, appname.io/ serves the marketing homepage, while acme.appname.io/ serves the actual app, both coexisting on the same path / but differentiated by hostname.

*(to be continued...)*

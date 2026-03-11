---
title: "Hit a Caching Bug on Deployment"
date: 2026-03-10
categories: [tech]
tags: [caching, deployment, cloudflare, bridz]
description: "A production debugging story where three layers of caching conspired to break our embed widget after a routine deploy."
---

Today I hit a production bug that took a while to figure out. Someone reported that the embed widget wasn't loading on their site. I checked it myself and it worked fine. Asked them to hard refresh. Still broken. More people reported the same thing. But on my end, everything was fine.

That's the worst kind of bug. The kind where it works for you but not for anyone else.

## The Setup

Bridz is a feedback platform. Customers embed a widget on their websites so their users can submit feature requests and vote on them. The widget is one of the most critical pieces. If it breaks, our customers' users see nothing.

The system has four main components that work together to serve this widget:

**The SDK** builds to a single file called `v1.iife.js`. This is a small JavaScript loader that customers include on their sites with a script tag. It's hosted as a static site on DigitalOcean and served at `bridz.io/sdk/v1.iife.js`. The filename is stable — it never changes — so customers never need to update their embed code.

**The App** is a Vue application that contains the actual widget UI. It's built with Vite, which produces hashed filenames like `embed-Ds2a99rp.js` and `embed-DI3syuOY.css`. The hash changes every time the code changes — that's Vite's cache-busting mechanism. This is also hosted as a static site on DigitalOcean, served under `bridz.io/assets/embed/`.

**The API** is a Laravel backend that handles everything server-side. When the SDK loads, it creates an iframe pointing to `bridz.io/embed/`. The API receives that request and serves the embed HTML page. This HTML page needs to reference the correct hashed JS and CSS filenames from the app build. The API doesn't hardcode these filenames — instead, it fetches a `embed-manifest.json` file from the app's static site. This manifest maps entry points to their current hashed filenames.

Because fetching that manifest file over HTTP on every single widget load would be slow, the API caches it in Redis with a 1-hour TTL. There's a `ViteManifestService` class that handles this — first check Redis, if miss then fetch from the app's URL, cache it, return. Simple and effective. Most of the time.

**Cloudflare** sits in front of everything. All requests to `bridz.io` and `*.bridz.io` go through Cloudflare, which caches static assets at the edge. The `cache-control` header on our static files are `s-maxage=86400` telling Cloudflare it can cache responses for up to 24 hours.

All four components are deployed on DigitalOcean's App Platform under a single app spec. The app and SDK are static sites, the API is a Docker container. DigitalOcean's ingress routing directs traffic to the right component based on the URL path. Push to any repo and the corresponding component rebuilds automatically.

## The Trigger

I pushed to two repos almost simultaneously. First, for the app repo it was a Volar Pug plugin for better template type-checking and a type refactor, since normal Volar can't detect Pug templates. Then the SDK repo with a few cleanup commits and a new feature. Just a daily dev stuffs. both triggered rebuilds at the same time.

The app rebuild produced new hashed filenames. `embed-Ds2a99rp.js` became `embed-D1FFUYRV.js`. `embed-DI3syuOY.css` became `embed-BQl7_AHz.css`. The old files were gone. New manifest, new hashes.

The SDK had a few commits that morning: cleaning up AI-generated noise files, removing an unused constant, updating the README, and adding theme parameter pass-through so the SDK now forwards `config.theme` to the embed iframe URL. That last one was a real feature change. The new SDK would send `?theme=light` to the embed. The old one wouldn't.

The SDK builds to `v1.iife.js`, a stable filename with no hash. That's by design, so customers never need to update their embed code. But it means no cache busting. Cloudflare had the old SDK cached with `s-maxage=86400`, so after the rebuild it kept serving the previous version for up to 24 hours. In this case the embed handled missing theme params gracefully, so it didn't break. But the risk is real. Any SDK change that alters the embed URL format or the message protocol could silently fail for a full day while Cloudflare serves the stale file.

The bigger problem was the app rebuild. The API didn't know it happened. It had the old manifest sitting in Redis, still pointing to `embed-Ds2a99rp.js`. That Redis cache wouldn't expire for up to another hour. So every time someone loaded the widget, the API served embed HTML with `<script type="module" src="/assets/embed/embed-Ds2a99rp.js">`, pointing to a file that no longer existed.

The two deploys also overlapped. SDK deploy started, then the app deploy started and superseded it partway through. There was a window where the platform was mid-rebuild across multiple components at the same time. Requests during that window could get partial or inconsistent responses.

## The Cascade

Three things went wrong in sequence.

**First** was DigitalOcean's SPA catchall. The app is configured with `catchall_document: public.html`, so any request that doesn't match an actual file gets routed to the Vue app's HTML shell. That's how client side routing works. Someone visits `/feature-requests/my-cool-idea`, no file exists there, so DO serves the shell and Vue handles the route.

The catchall doesn't know the difference between a valid route and a missing file. When the browser requested `embed-Ds2a99rp.js`, the file was gone. DO served `public.html` instead. Content type `text/html`, status 200. Not 404. Everything downstream thought it was a successful response.

**Second**, Cloudflare cached that. It saw a 200 for a `.js` URL with `s-maxage=86400` in the headers. Cached for 24 hours. Now every user hitting that edge node got back an HTML file instead of JavaScript. No request even reached DigitalOcean anymore.

**Third** was Chrome's MIME type checking. The embed loads its JavaScript with `<script type="module">`. The spec says browsers must check MIME types for module scripts. If the response isn't a JavaScript MIME type, the browser refuses to execute it. Chrome and Edge follow this strictly. So when they got `text/html` where they expected JavaScript, they rejected it:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html".
Strict MIME type checking is enforced for module scripts per HTML spec.
```

Widget completely broken. Empty iframe. Nothing rendered.

Firefox is more lenient. It'll try to parse the response anyway. So if you tested in Firefox, it might have looked fine. "Works in Firefox, not Chrome" sounds like a browser compatibility bug, not a caching bug. That threw me off for a while.

## Why It Worked For Me

This played out in two phases, and both times I was the last to see the problem.

First, browser cache. I'd been using Firefox all day, so my browser had the old JavaScript file cached from before the deploy. It never even made a request. Everything looked fine on my end. I asked people to hard refresh. Ctrl+Shift+R. But the widget loads inside an iframe, and hard refreshing the parent page doesn't clear subresources cached by the iframe. So that didn't help them.

Then even after the Cloudflare purge, I opened Chrome to test fresh. Still broken. But Firefox worked. That's when the browser difference clicked. Some Cloudflare edge nodes still had the poisoned `text/html` response cached. Chrome rejected it. Firefox didn't.

I'd been debugging the whole time in the one browser that was most forgiving of the problem.

## The Wrong Fix

People couldn't use the widget and I was under pressure. My first instinct was to look at what changed. I'd just pushed a Volar Pug plugin, some type fixes, a refactor. Maybe the new dependency pulled in something heavy? Maybe the type refactor broke a runtime import?

I reverted everything. `git reset --hard` to the previous known good commit. Force pushed to master. DigitalOcean started another rebuild.

That triggered a new set of hashed filenames. Now there were three sets floating around: the originals in people's browser caches, the ones from my first push that Cloudflare had cached, and the new ones from the revert. The API's Redis cache was still stale. Every push was making things worse.

I hit "Purge Everything" on Cloudflare. Still broken. Purging just meant the next request went to the origin, but the origin was still serving the wrong thing. Redis still pointed to the old hashes. API generated embed HTML referencing files that didn't exist. DO returned the catchall HTML. Cloudflare re-cached it immediately. Back to square one within seconds.

## Finding the Real Problem

I exported a HAR file from Chrome DevTools. One line explained a lot:

```
200  132ms  586B  text/html  bridz.io/assets/embed/embed-Ds2a99rp.js
```

586 bytes of HTML where there should have been 488KB of JavaScript. Response headers: `cf-cache-status: HIT` and `x-do-orig-status: 404`. Cloudflare was serving a cached response that originally came back as a 404.

Then I fetched the actual Vite manifest from the static site:

```json
{
  "embed.html": {
    "file": "assets/embed/embed-D1FFUYRV.js",
    "css": ["assets/embed/css/embed-BQl7_AHz.css"]
  }
}
```

The manifest said `embed-D1FFUYRV.js`. The API was serving HTML referencing `embed-Ds2a99rp.js`. Clear mismatch. The API was reading from the old Redis cache.

The fix:

```php
php artisan tinker --execute="Cache::forget('vite_manifest');"
```

One line. Clear Redis, API fetches the new manifest, embed HTML references the correct files. Then purge Cloudflare so the poisoned responses get evicted.

But that's a manual step. Any future app deploy would need the same thing. So I checked the actual cost of skipping the cache. The manifest fetch is just a server to server HTTP call in the same region, maybe 5-20ms. Not worth the risk. I removed the Redis cache entirely.

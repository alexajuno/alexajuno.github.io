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

I pushed to two repos almost simultaneously. First, the app repo — a Volar Pug plugin for better template type-checking and a type refactor, since normal Volar can't detect Pug templates. Then the SDK repo with a few cleanup commits and a new feature. Both repos have `deploy_on_push: true` on DigitalOcean, so both triggered rebuilds at the same time.

The app rebuild produced new hashed filenames. What was `embed-Ds2a99rp.js` became `embed-D1FFUYRV.js`. What was `embed-DI3syuOY.css` became `embed-BQl7_AHz.css`. The old files were gone — the build uses `--emptyOutDir` to clean the output directory. The new manifest file reflected the new hashes.

The SDK had four commits that morning — cleaning up AI-generated noise files, removing an unused constant, updating the README, and most importantly, adding theme parameter pass-through so the SDK now forwards `config.theme` to the embed iframe URL. That last one was a real feature change, not just cleanup. It meant the new SDK would send `?theme=light` to the embed, while the old one wouldn't.

But here's the problem: the SDK builds to `v1.iife.js` — a **stable filename with no hash**. That's by design, so customers never need to update their embed code. But it also means there's no cache-busting. Cloudflare had the old SDK cached with `s-maxage=86400`, so after the rebuild it kept serving the previous version for up to 24 hours. Users would get the old SDK (without theme support) talking to the new embed (expecting theme params) for a full day. In this case the embed handled missing theme params gracefully, so it didn't break. But the risk is real — any SDK change that alters the embed URL format or the message protocol could silently fail for 24 hours while Cloudflare serves the stale file.

The bigger problem was the app rebuild. The API didn't know it happened. It had the old manifest sitting in Redis, still pointing to `embed-Ds2a99rp.js`. That Redis cache wouldn't expire for up to another hour. So every time someone loaded the widget, the API served embed HTML with `<script type="module" src="/assets/embed/embed-Ds2a99rp.js">` — pointing to a file that no longer existed on the static site.

And because the two deploys overlapped (the SDK deploy started, then the app deploy started and superseded it partway through), there was a window where the platform was mid-rebuild across multiple components simultaneously. Requests hitting the system during that window could get partial or inconsistent responses.

## The Cascade

Here's where it gets interesting. Three things went wrong in sequence, each making the situation worse.

**First: DigitalOcean's SPA catchall.** The app is configured as a single-page application on DO's App Platform with a `catchall_document: public.html` setting. Any request that doesn't match an actual file gets routed to the app's HTML shell. This is what makes client-side routing work — if someone visits `/feature-requests/my-cool-idea`, there's no file at that path, but the catchall serves the Vue app which handles the route client-side.

The problem is that this catchall doesn't distinguish between "this is a client-side route" and "this file genuinely doesn't exist." When a browser requested `embed-Ds2a99rp.js`, the file was gone, so DO served `public.html` instead — with `content-type: text/html` and HTTP status 200. Not 404. As far as anything downstream was concerned, this was a successful response.

**Second: Cloudflare cached the bad response.** Cloudflare saw a 200 response for a URL ending in `.js`. The response headers said `s-maxage=86400` — "cache this for 24 hours." So it did. Now every subsequent request for that JS file, from any user hitting that edge node, got the cached HTML response back. No request even reached DigitalOcean anymore.

**Third: Chrome's strict MIME checking.** The embed HTML loads its JavaScript with `<script type="module">`. The HTML spec says browsers must enforce MIME type checking for module scripts — if the server responds with anything other than a JavaScript MIME type, the browser must refuse to execute it. Chrome and Edge follow this strictly. So when they got `text/html` for what should be a module script, they rejected it:

```
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html".
Strict MIME type checking is enforced for module scripts per HTML spec.
```

The widget was completely broken. No JavaScript executed, no UI rendered, just an empty iframe on the customer's site.

Firefox is more lenient with MIME checking — it'll attempt to parse the response regardless. So if someone tested in Firefox, it might have appeared to work. "It works in Firefox but not Chrome" sounds like a browser compatibility issue, not a caching issue. That threw me off for a while.

## Why It Worked For Me

This played out in two phases, and each time I was the last person to see the problem.

**At first: browser cache.** I'd been using Firefox and visiting the site all along, so my browser had the old (correct) JavaScript file in its local cache from before the deploy. It never even made the request to Cloudflare. From my perspective, everything was fine. I could refresh, navigate, test different boards — all good. I asked people to hard refresh. Ctrl+Shift+R. But the embed widget loads inside an iframe, and hard-refreshing the parent page doesn't necessarily clear cached subresources loaded by the iframe. So even that didn't help them.

**Even after the Cloudflare purge: browser MIME checking.** After the Cloudflare purge and some back and forth, I opened Chrome to test it fresh — no cache, first visit. Still broken. But it worked in my Firefox. That's when the browser difference became clear. Chrome and Edge strictly enforce MIME type checking for `type="module"` scripts and refuse to execute anything that isn't `text/javascript`. Firefox doesn't enforce this as strictly. So even after the CDN cache issue was partially resolved, Chrome users were still getting rejected because some Cloudflare edge nodes still had the poisoned `text/html` response cached, and Chrome wouldn't tolerate it. Firefox would.

I had been debugging the whole time in the one browser that was most forgiving of the problem.

## The Wrong Fix

At this point I was under pressure. People couldn't use the widget. My first instinct was to look at what changed. I had just pushed a few commits: a Volar Pug plugin for template type-checking, some type error fixes, and a refactor to unify attachment types. Maybe the new dev dependency was pulling in something heavy? Maybe the type refactor broke a runtime import?

I reverted all pushed commits immediately as the pressure was escalating. `git reset --hard` to the previous known-good commit. Force pushed to master. DigitalOcean picked it up and started another rebuild.

That triggered yet another set of hashed filenames. Now there were three different sets of hashes floating around: the original ones in people's browser caches, the ones from my first push that Cloudflare had cached, and the brand new ones from the revert. The API's Redis cache was still stale from the first deploy. Every push was making things worse.

I tried to hit "Purge Everything" on Cloudflare. The natural instinct of the CDN is serving stale content, flush the cache. It didn't help. The widget was still broken. Purging Cloudflare just meant the next request went straight to the origin, but the origin was still serving the wrong thing. The API's Redis cache still pointed to the old hashes, so the API generated embed HTML referencing files that didn't exist, DO returned the HTML catchall, and Cloudflare immediately re-cached the bad response. We were back to square one within seconds of the purge.

## Finding the Real Problem

I exported a HAR file from Chrome DevTools and a line in it told me a bit about story:

```
200  132ms  586B  text/html  bridz.io/assets/embed/embed-Ds2a99rp.js
```

586 bytes of HTML where there should have been 488KB of JavaScript. The response headers confirmed it: `cf-cache-status: HIT` — Cloudflare was serving this from its edge cache. And `x-do-orig-status: 404` — the original response from DigitalOcean was a 404 that the SPA catchall converted to a 200.

Then I fetched the Vite manifest that the app's static site was actually serving:

```json
{
  "embed.html": {
    "file": "assets/embed/embed-D1FFUYRV.js",
    "css": ["assets/embed/css/embed-BQl7_AHz.css"]
  }
}
```

The manifest said `embed-D1FFUYRV.js`. The API was serving HTML that referenced `embed-Ds2a99rp.js`. A clear mismatch. The API was reading from an old manifest cached in Redis.

So, the final fix was:

```php
php artisan tinker --execute="Cache::forget('vite_manifest');"
```

One line. Clear the Redis cache, API fetches the new manifest, embed HTML now references the correct files. Then purge Cloudflare cache so the poisoned JS responses get evicted.

But that's still a manual step. Every future app deploy would need the same cache clear. So I looked at the actual performance cost of the cache. The manifest fetch is a server-to-server HTTP call. The API fetching a tiny JSON file from the static site in the same region, maybe 5-20ms. So I decided it's not worth the risk. I removed the Redis cache entirely.

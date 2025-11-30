---
layout: post
title: "Observability in Development"
date: 2025-11-30
categories: [tech]
tags: [observability]
---

# Observability in Development

So you developed an app, it's in production now, serving a number of customers. And suddenly one day (or in several days), someone reports that the app is lagging, or even down. What are you even gonna do? Well, recently I had a chance to take a look at a similar situation, and I found that the system is kinda... hard to know what's going on. It's not as certain as a bug that always appears in specific logic. It happens at random times, on random pages, for random users. How do you even start to debug that? 

Honestly, until now, I don't know. In modern web architecture, anything could fall apart. But at least, the more clues you have, the better chance you have to know what can be improved in the app. It should never be a guessing game like "hey, probably our database is overloaded", but things should be measurable: what's the `throughput` or `response time` of your server? Then if issues happen randomly, can your current monitoring help with tracing down that single request from end to end, from frontend performance to Cloudflare request blocking events, to ingress logs, to whatever it is... that's probably what people call **observability**. And it'll save you tons of headaches in operation and maintenance. Side note: it's also a must for security too, regarding a post of mine about security.

## refs

- [patio11 post](https://www.kalzumeus.com/2010/04/20/building-highly-reliable-websites-for-small-companies/)
- [A Sentry blog](https://blog.sentry.io/monitoring-observability-and-debuggability-explained/) probably Sentry evolved from pure error report to full observability recently I guess.

---
layout: post
title: "A small step toward building a personal ai companion"
date: 2026-02-01
categories: [tech]
tags: [ai, claude]
---

# A small step toward building a personal ai companion

Recently there is a new tool released, receiving high attention and praises from people, one of the fastest repo getting stars in GitHub, which is OpenClaw. And there are a few things around this I would want to share.

In a few recent months, I spent time working on building AI companion. The biggest problems with popular chatbots like Gemini, specifically context/memory, is, sometimes it's just, not what I need. Why I say that? It uses context when I don't want. And when it does? It feels, irrelevant. As long as I can see, it only saves a few facts about us in data, call it memory. But human can't feel the companion in this way. Some basic facts like names, address, etc. is necessary. But trying to remember someone likes banana? No thanks, that can change very quickly. So honestly it sucks with memory.

The first few things I tried, or thought of, is learning how to store the data effectively, allowing AI to retrieve the context that I want. I think it need to be a whole life context, with layers, threads, events, people, etc. and trying to store things in a structured, maybe too structured. Like, I thought an events can have layers including facts, emotions, reflections and actions. splitting into markdown headers, but then I realized that it's too complex and maintaining that is like a boredem. I don't process things in that way. At least, when you are trying to talk to a friend, or chatbot, you'll relay small things, stuffs combined, grow through each line. And if it's being too structured, it feels, less human. So the next question is, what does it take to be, human? How a chatbot can make you feel being listened, understood?

I spent time reading on how does it feel like to have someone understand you, in term of psychology. Psychology has always been my favorite subject and we have found a few basics ideas like, for a good chat session, if someone can reframe what you said, in different words, maybe making it clearer, have profound effect. It makes you feel understood, having better understanding of yourself. And in psychotherapy, maintaining a good relationship, a shared context between people is extremely essential. What's most important is we have shared terms. Like, when you mentioning sth, both know the hang of it. And there are a few more ideas but it revolves around that.

So, still, we need to build context. Until the release of clawdbot (now openclaw). I tried it. Looking at how it works. with the daily memory entries. I don't like clawdbot really, I don't need all the automation it provides. I don't use 1password or apple products. 

But it inspires me, combining with Claude Skills structure, I figure out what I need for my personal AI companion. I currently decided to use Claude Code, with CLAUDE.md being automatically called at dir, so we can put layers, dir structure, to help, guide the bot into my personal knowledge database, stored in pure markdown. Since search tool and web search by claude is much more native, it feels better than OpenClaw to have to use (Brave) Search API. I mean, Claude Code CLI has already had bunch of useful stuffs. It's just need a personal database organized in certain structure. I still use objects mentioned in the flow above but I discarded the idea of vector database or any database to query. Just let chatbot knows structure and it fetches related files. If files become bigger, we add another layer on top. Previously I tried to write layers within a single file, but now layers should be in separate files, separate structures. For example, my current flow is, having chat, having a day, write into daily entries. Then we have `themes`, about topics like work/career, romance, health, etc. in which we can ask the bot to sync with daily entries. I mean, I have everything written by myself, or the bot, in daily entries, and the rest are updated accordingly in layers. Each week, having weekly reflection, and updating info about people mentioned in the daily entry, and so on. Currently it's working quite okay.

In the end, probably I won't public the structure, since I think, each will need to spend their own time organizing the way they want, what works in their context. But yeah, it feels like the vertical agent idea I saw a while ago, in which we'll just chat with the bot, and adding structured context files all around, and it'll be able to understand context much better.

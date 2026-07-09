---
title: "Approaches on Agent Memory Extraction"
date: 2026-07-09
categories: [tech]
tags: [ai, claude, memory, phileas]
description: "Weighing approaches to memory extraction for a coding agent, per-turn hooks, a background API worker, and manual human-in-the-loop, and why the last one is the one that actually held up."
---

I've been building Phileas, an agent memory layer. Wanna share a question I hit recently: when does a memory actually get created, how it's created, and who decides it's right.

I've gone through three approaches so far.

The first one is tight to each turn. Every message pair between me and Claude Code is an event, and I hook into the end of the turn to nudge the live model into deciding if something is worth memorizing. This is the version that shipped first, and it has two kinds of problems.

One is correctness. The model can misread my intent mid conversation. I've had things get written down that weren't quite what I meant, or that needed a few more turns before they were even true yet, an intention that only firms up after more back and forth, not on the turn it first showed up. A memory written too early is just a wrong memory with more confidence behind it. Even though the memory could be updated later, it's still a waste.

The other is cost, in both senses of the word. Nudging the model to memorize on every turn slows the loop down, because now every response waits on an extra decision. And if you're running an expensive thinking model for agentic coding work, which is most of what people actually use Claude Code for, you're paying thinking-model prices for what's basically bookkeeping.

So the next idea was to get it off the critical path entirely. Hand the whole session context to a separate API call, on a cheaper model, running in the background. This solves the latency and the cost. But it trades them for a different problem: duplication. You're reprocessing the entire context a second time, and even cheap-model duplication adds up once you're doing it across every session.

The bigger problem is validation. A background worker doesn't get to ask "wait, did I understand that right" mid-conversation. It flushes on a timer, working off a transcript that's already lossy by the time it gets there. You can put a queue in front of it and let the user approve or reject each candidate through a CLI or a web page, but the failures I actually ran into weren't "keep this or discard it." They were "this is basically right but worded wrong, or scoped to the wrong thing, and I want to fix it, not vote on it." A queue that only takes yes or no doesn't give you that, and by the time it's in the queue the context that would let you fix it properly is already gone.

So to try to mitigate those problems, I landed on manual approach. No automatic capture at all. The live model, which already has the whole conversation in context, proposes a memory through a tool call only when I ask it to. Nothing gets written until I look at the proposal and approve it, through a queue I can list, show, edit, or reject from the CLI.

The reason this works where the other two didn't is that the understanding was already sitting in the live conversation the entire time. There's no context to duplicate, because nothing left the session to get reprocessed elsewhere. And because users are the one triggering it and the one reading the proposal before it's stored, they can catch the case the queue-and-vote approach couldn't: not just wrong, but slightly wrong, and worth fixing instead of throwing away.

I still keep the other two modes in the code. The per-turn hook is still there for people who want memory happening without thinking about it, and the background worker might still work with cases like importing memory from somewhere Phileas wasn't present for, where there's no live session to ask.


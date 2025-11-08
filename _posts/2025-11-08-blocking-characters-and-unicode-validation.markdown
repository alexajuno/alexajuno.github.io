---
layout: post
title: "Blocking Characters and Unicode Validation"
date: 2025-11-08 07:50:36 +0700
categories: tech
---

Recently I had a chance to work on blocking certain characters from user input in a text field. It sounds simple on the surface, but it ended up dragging me into the weird and slightly chaotic world of Unicode.

Computers share a standard for representing basically every character on Earth named Unicode. So to block characters, I have to categorize them. My first instinct was to handle everything by raw code points, but that quickly became unmanageable. Later I discovered Unicode regex scripts, where characters are grouped into meaningful sets. I'm still not sure whether it's fully JS, browser support, or both doing the heavy lifting, but it made the job a lot easier.

There was one caveat though: a lot of characters are shared between scripts, especially inside the big "Other Symbols" group (\p{So}) and the emoji universe. Unicode wasn't designed with emoji at first, so both sets overlap heavily. Trying to hand-write a complete emoji-filtering regex was hard. So I borrowed a public GitHub repo that maintains an updated emoji list instead of reinventing the wheel.

At one point I tried the approach of directly removing blocked characters from the input field. That turned out to be a bad idea. From a UX perspective, it's incredibly frustrating for users when the app silently deletes the characters they're trying to type. Most well-designed input fields don't do that. They let you type whatever you want and then use a checklist or validation message to explain what's allowed. On top of that, directly modifying the input value causes unexpected behavior in IME-heavy languages like Vietnamese, where characters are composed step-by-step. Auto-removal can break the composition process entirely.

So unless it's absolutely necessary, sticking with the normal UX pattern of "validate and display requirements" is way safer than trying to mutate user input on the fly.

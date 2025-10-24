---
layout: post
title: "🧠 Reflections on Security in Modern SaaS Products"
date: 2025-10-24 12:00:00 +0000
categories: tech security
---

# 🧠 Reflections on Security in Modern SaaS Products

Recently, I had the chance to look at a real SaaS product from a security perspective. It was a fascinating experience, helping me see both how far modern software has come and how many gaps still remain.

In today's world, data breaches happen far too often. While large enterprises usually have dedicated security teams and protocols, many small and medium-sized businesses still treat cybersecurity as an afterthought. Ironically, that makes them even more attractive targets for attackers.

When reviewing the development codebase, I noticed how modern frameworks and cloud services already mitigate many basic threats by default. Features like web application firewalls (WAFs) and built-in input validation protect against common injection attacks and cross-site scripting vulnerabilities. I also had the opportunity to evaluate authentication mechanisms like multi-factor authentication (MFA), passkeys, password policies, and more. Honestly, with proper input sanitization and browser security improvements, the old tricks like stealing tokens from `localStorage` via XSS doesn't look promising anymore.

Still, security isn't just about tools or configurations. As long as individuals and organizations fail to at least follow systematic models like the **McCumber Cube**, vulnerabilities will always exist. Even with strong technical defenses, human and procedural factors can easily introduce weaknesses.

In parallel, I explored several research papers analyzing real-world attacks. Some of these incidents were incredibly sophisticated, involving multiple stages, persistence techniques, and well-funded actors. It's a long way from the "script kiddie" era when someone would just run public exploits and call themselves a hacker. I still remember a high school acquaintance bragging about being a "Facebook hacker". That naive overconfidence now seems almost nostalgic.

Interestingly, this exploration also made me reflect on the psychology behind hacking. There's a certain rush, an intoxicating feeling of power, when you gain access to information others can't. But true expertise in security isn't about that kind of ego boost. It's about continuous learning, protecting systems and people, and contributing to a safer digital environment.

Ultimately, I've come to think of cybersecurity less as a fortress and more as a surveillance and response system. The goal isn't perfect defense. Just as in software development, there will always be bugs. Instead, it's about having the right **detection, alerting, and response mechanisms** in place so that when something goes wrong, you can act quickly to contain the damage. In that sense, security principles apply not just to code, but to life itself.

This experience also inspired me to be more mindful about **data awareness**, both personally and organizationally. Whenever handling data, I have a small caveat in my mind if it's fitting into the classic CIA triad?

---
layout: post
title: "Adding Email to Bridz"
date: 2026-02-15
categories: [tech]
tags: [email, laravel, bridz]
---

This is a continuation of my previous post about [building Bridz](/tech/2026/02/01/when-vibe-coding-meets-multi-tenant-architecture.html). In the last week, the most important feature I built was email notifications.

## Choosing a Provider

We first went with AWS SES since it's famous for being very cheap compared to others. The setup starts with verifying your domain by adding DNS records: SPF, DKIM, DMARC. Honestly I didn't fully understand what each of these does. I just followed the steps, added the records, and waited. SPF verified quickly but DMARC took about 3 days. Long wait.

After all that, I requested production access. AWS came back asking how I handle bounces, complaints, unsubscribe. I wrote what I thought was a decent reply. Low volume, only registered users, suppression list, unsubscribe links in every email. Got rejected. To this day I still don't know why. Looking back, I think the problem was I wrote everything in future tense. "We will configure," "our application will maintain." Instead of showing things already built. New domain, new account, zero emails sent. They had no reason to trust me.

## Switching to Brevo

The company was already using Brevo for other products so it was a natural move. Discussed with the POs and agreed. Brevo gives 300 free emails per day, more than enough for a small app like Bridz. The code change was significant compared to the SES setup but manageable with AI assistance.

What does Bridz need to send? Transactional stuff. Post status changed (planned, in progress, complete), new comment, @mention, admin daily digest, changelog published, email verification, member invitations. About 9 different types.

## Templates: Where Do They Live?

Email has templates. A decision needed to be made: Blade files in Laravel, or Brevo's hosted templates with their API?

With Blade, you just need SMTP credentials. Simple. But then it's fire-and-forget. You send the email and don't really know what happened. Did it get delivered? Did it bounce? You'd need to set up webhooks and extra stuff just to get basic visibility.

With Brevo API, templates live on their side. You send via API with parameters, and you get logs, delivery tracking, bounce monitoring on their dashboard. No extra infrastructure needed. I went with this.

For the template content, at first we used visual block. But later on I find that with AI generation these days, I just asked models to generate the HTML and pasted it as code into Brevo. Much faster than dragging blocks around, and it allows custom logic that the visual editor can't handle. Nice.

## Making It Work with Laravel

Here's where it gets interesting. Laravel's built-in notification system has a mail channel but it expects Blade templates. We're not using Blade, we're calling Brevo's API with template IDs and parameters. So the built-in channel doesn't fit.

AI drafted a custom notification channel and I found it valid. It's actually the right pattern here. Three small pieces:

**BrevoMessage**, just a data object. Template ID + parameters array. Nothing fancy.

**BrevoChannel**, hooks into Laravel's notification system. Receives a `BrevoMessage`, passes it to the API client.

**BrevoApiClient**, makes the actual HTTP call to Brevo's `/v3/smtp/email` endpoint.

Each notification class has a `toBrevo()` method that returns what to send:

```php
return new BrevoMessage(
    config('services.brevo.templates.post_status_changed'),
    [
        'POST_TITLE' => $this->post->title,
        'NEW_STATUS' => $this->toStatus->label(),
        'ADMIN_COMMENT' => $this->comment ?? '',
        'POST_URL' => $this->getPostUrl(),
        'WORKSPACE_NAME' => $workspace->name,
    ]
);
```

Template IDs live in config via env vars. If we ever need to switch providers again, we only touch the API client. None of the 9 notification classes change. That's actually why the SES-to-Brevo switch wasn't as painful as it could have been.

## Local Dev

For local development, when there's no Brevo API key configured, the system falls back to Mailpit. It catches all outgoing emails locally so you can test the whole flow without sending real emails or burning your free quota. Small thing but makes a big difference when you're iterating.

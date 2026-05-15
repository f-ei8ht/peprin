---
title: Building Peprin — a browser-native video editor
description: The story behind Peprin, why we built it, and what makes it different from traditional video editors.
date: 2026-04-20
author: Peprin Team
tags: product, engineering
---

## Why another video editor?

Most video editors fall into two camps: heavyweight desktop applications that require powerful hardware, and cloud-based tools that upload your footage to someone else's server. Peprin sits in the middle — it runs entirely in your browser, but keeps your media local to your device.

## Browser-native means something different

When we say "browser-native," we mean it. Peprin uses WebCodecs for encoding and decoding, OffscreenCanvas for rendering, and IndexedDB for storage. There is no Rust, no WebAssembly compositor, and no backend server required for the core editing experience.

This architecture gives us a few advantages:

1. **Instant start** — no download, no installation. Open the URL and start editing.
2. **Privacy by design** — your footage never leaves your machine unless you choose to use AI features.
3. **Cross-platform** — works anywhere Chrome or Firefox runs, including Linux and ChromeOS.

## The editing model

Peprin combines a multi-track timeline with a real-time preview canvas. You can layer video, images, text, stickers, and subtitles, then apply effects and masks per clip. Everything renders at the project's native resolution, whether that's 1080p or 4K.

## What about AI?

We partner with HeyGen for AI-powered features. When you want to add an AI avatar, generate voiceover, or translate your content, those requests go to HeyGen's API. The rest of your project stays local. You control when and what data leaves your browser.

## What's next

We're focused on making the core editing experience fast, reliable, and delightful. Export is done. Keyboard shortcuts are done. Timeline performance at 1000+ clips is done. Next up: more effects, better text handling, and even faster rendering.

Stay tuned — and keep editing.

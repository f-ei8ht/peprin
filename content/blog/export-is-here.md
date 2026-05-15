---
title: Export is here — render MP4, WebM, GIF, and PNG right from the browser
description: Peprin now supports full export to MP4 (H.264), WebM (VP9), animated GIF, and PNG image sequences using WebCodecs and mediabunny.
date: 2026-05-01
author: Peprin Team
tags: release, export
---

## No more waiting for renders

One of the biggest pain points with cloud-based editors is waiting. You finish your edit, hit export, and then stare at a progress bar while a server farm churns through your composition. With Peprin, export happens right in your browser using WebCodecs — the same hardware-accelerated encoding APIs your browser uses for video calls.

## What we support

Today, you can export in four formats:

- **MP4 (H.264 + AAC)** — the universal standard. Plays everywhere.
- **WebM (VP9 + Opus)** — open codec, great quality-per-bit.
- **Animated GIF** — for quick social shares, capped at 300 frames.
- **PNG Sequence** — individual frames for compositing work or frame-by-frame editing.

All exports use the same compositor as the preview, so what you see is exactly what you get.

## How it works under the hood

1. The compositor renders each frame at your chosen resolution and frame rate.
2. For video exports, frames are fed into WebCodecs' `VideoEncoder` via mediabunny's `CanvasSource`.
3. Audio tracks are mixed offline using the Web Audio API, then encoded with `AudioEncoder`.
4. The encoded packets are muxed into the final container format using mediabunny's built-in muxers.

The entire pipeline runs on the main thread with cooperative scheduling, yielding every few frames to keep the UI responsive. You can cancel at any time, and all encoder resources are released immediately.

## Performance notes

On a mid-range laptop, 1080p30 exports run at about 2-3x real-time for simple compositions. Adding multiple video layers or heavy effects will slow things down — we're working on Web Worker offloading for the compositor to improve this further.

## Try it out

Open any project, click Export in the editor header, pick your settings, and hit go. Your file downloads directly to your machine — no queue, no upload, no wait.

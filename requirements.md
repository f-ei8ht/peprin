# Requirements Document

## Introduction

Peprin is a browser-based, TypeScript-only clone of the OpenCut video editor whose source lives in `/home/f8/Desktop/peprin/context/`. The clone will be built inside the existing Next.js 16 + React 19 + Tailwind v4 + shadcn project at `/home/f8/Desktop/peprin/`. The intent is to preserve the OpenCut feature surface (timeline, preview, media library, effects, masks, stickers, text, subtitles, transcription, export, projects, marketing pages) while:

1. **Replacing the entire Rust + WebAssembly compositor/effects/masks core with TypeScript implementations** running in the browser (Canvas2D, WebGL2, WebGPU, WebCodecs, OffscreenCanvas, Web Workers, mediabunny, @huggingface/transformers).
2. **Adopting Peprin's own visual identity** by sourcing all colors, radii, fonts, and base styles from the existing tokens in `app/globals.css`. OpenCut's branding, copy, and visual chrome must not be reproduced verbatim. Layout structures may be inspired by OpenCut, but skinned with Peprin tokens.
3. **Shipping in well-bounded sub-phases** so each milestone is independently demonstrable and the team can pause between sub-phases.

This spec covers **Phase 1 only**. Out of scope for this spec:

- **Phase 2**: HeyGen integration (avatars, voice, AI-generated video clips).
- **Phase 3**: End-to-end testing, polish, accessibility audit, performance budgets, public release, marketing site go-live.

Phase 1 is decomposed into twelve sub-phases (1.1 through 1.12). Each sub-phase produces a working, demoable slice of the editor.

## Glossary

- **Peprin**: The Next.js application at `/home/f8/Desktop/peprin/` that hosts the cloned editor.
- **Source**: The OpenCut monorepo at `/home/f8/Desktop/peprin/context/`. Specifically `apps/web/src/` for the web app and `rust/crates/` for the Rust core.
- **Editor**: The interactive video editing UI at the `/editor` route, comprising preview canvas, timeline, panels, and toolbars.
- **Compositor**: The TypeScript module responsible for combining timeline tracks into a single output frame on a Canvas/WebGL/WebGPU surface, replacing the Rust `compositor` crate.
- **Renderer**: The TypeScript pipeline that produces preview frames from project state for the Editor and produces export frames for the Export sub-phase.
- **Project**: A persisted collection of media references, tracks, clips, effects, and metadata describing a single editable video composition.
- **Media_Library**: The user-scoped collection of imported source assets (video, audio, image) available to drop on the timeline.
- **Timeline**: The horizontal multi-track surface that holds clips ordered in time, supporting trim, split, ripple, retime, and reorder.
- **Track**: A single horizontal lane within the Timeline. Tracks are typed (video, audio, text, sticker, subtitle).
- **Clip**: A bounded segment on a Track referencing a portion of a media asset, text run, sticker, or other timed element.
- **Effect**: A per-clip or per-track visual or audio transform (blur, color grade, gain, etc.) applied during compositing.
- **Mask**: A shape or alpha source that constrains where a clip or effect is visible.
- **Sticker**: A static or animated overlay (image, shape, lottie-like asset) placed on a video Track.
- **Subtitle**: A timed text element rendered over the preview, typically generated from Transcription or imported as SRT/VTT.
- **Transcription**: The process of converting an audio Track into timed text using `@huggingface/transformers` running in a Web Worker.
- **Export**: The process of rendering the final composition to a downloadable file (MP4, WebM, GIF, image sequence) using WebCodecs and mediabunny.
- **Design_Tokens**: The CSS custom properties defined in `app/globals.css` (`--background`, `--foreground`, `--primary`, `--radius`, `--font-sans`, etc.) that govern Peprin's visual identity.
- **Local_First_Mode**: A storage mode where Projects and Media_Library entries persist to IndexedDB and the Origin Private File System (OPFS), with no backend account or server required.
- **Backend_Mode**: An optional storage mode using Postgres via Drizzle ORM, Better-Auth for authentication, and Upstash Redis for rate limiting, mirroring the OpenCut backend stack.
- **Static_Pages**: Marketing and informational pages from the source: blog, changelog, contributors, roadmap, sponsors, brand, privacy, terms.

## Cross-Cutting Constraints

The following constraints apply to every sub-phase (1.1 through 1.12) unless explicitly noted otherwise.

### Requirement A: TypeScript-Only Implementation

**User Story:** As the project owner, I want the entire editor to be implemented in TypeScript and browser-native APIs, so that the application is fully web-based and avoids a Rust + WebAssembly toolchain.

#### Acceptance Criteria

1. THE Peprin codebase SHALL contain zero `.rs` source files and zero `.wasm` binary artifacts produced by `wasm-pack`.
2. THE Peprin codebase SHALL NOT depend on the `opencut-wasm` package or any package whose primary purpose is to wrap a Rust crate compiled to WebAssembly for compositing, effects, or masks.
3. WHEN the Compositor renders a frame, THE Compositor SHALL execute in the browser using one or more of: Canvas2D, WebGL2, WebGPU, OffscreenCanvas, or a Web Worker.
4. WHEN visual Effects defined in the source `rust/crates/effects/` are reimplemented in Peprin, THE Effects module SHALL implement them as TypeScript functions or shaders (GLSL/WGSL) loaded as strings, not as WebAssembly modules.
5. WHEN Masks defined in the source `rust/crates/masks/` are reimplemented in Peprin, THE Masks module SHALL implement them using Canvas2D path operations, WebGL stencil operations, or WebGPU compute, all in TypeScript.
6. WHERE a browser-native API exists for a task (WebCodecs for encode/decode, WebAudio for audio graphs, OffscreenCanvas for off-thread rendering, File System Access API or OPFS for storage), THE Peprin implementation SHALL prefer the native API over a polyfill or third-party engine.
7. IF a feature in the source is implemented only in Rust and has no equivalent TypeScript implementation reachable within Phase 1, THEN THE Phase 1 plan SHALL mark that feature as deferred and document the substitution strategy in the Design phase.

### Requirement B: Visual Identity from `app/globals.css`

**User Story:** As the project owner, I want Peprin to use my own design tokens, so that the editor reflects my brand and is not a visual clone of OpenCut.

#### Acceptance Criteria

1. THE Peprin UI SHALL source every color, radius, font-family, and base spacing from the CSS custom properties defined in `app/globals.css`.
2. THE Peprin UI SHALL NOT introduce hard-coded color values (hex, rgb, oklch literals) inside component files when an equivalent Design_Token exists in `app/globals.css`.
3. THE Peprin UI SHALL NOT include OpenCut's logo, wordmark, mascot, marketing copy, or any image asset under `context/apps/web/public/logos/opencut/`.
4. WHERE the source UI uses a layout pattern (panel arrangement, toolbar grouping, timeline ruler structure), THE Peprin UI MAY adopt the same structural pattern.
5. WHEN a UI component is added to Peprin, THE component SHALL be skinned using the existing shadcn baseline at `components/ui/` and the Design_Tokens, not by copying OpenCut component CSS.
6. WHEN icons are used, THE Peprin UI SHALL use the `@phosphor-icons/react` package already installed in Peprin, replacing OpenCut's `@hugeicons/react` and `lucide-react` dependencies, except where Phase 1 design explicitly justifies an exception.

### Requirement C: Sub-Phase Boundaries

**User Story:** As the project owner, I want each sub-phase to be independently demonstrable, so that I can review progress incrementally and pause between sub-phases.

#### Acceptance Criteria

1. THE Phase 1 plan SHALL be organized into the twelve sub-phases enumerated in Requirements 1 through 12.
2. WHEN a sub-phase is declared complete, THE corresponding feature SHALL be reachable from the Peprin UI without requiring features from a later sub-phase.
3. WHERE a sub-phase depends on functionality from an earlier sub-phase, THE later sub-phase SHALL declare that dependency explicitly in the Design phase.

---

## Requirements

### Requirement 1: Sub-Phase 1.1 — Foundation and Scaffolding

**User Story:** As a developer, I want a scaffolded editor app with the right project structure, dependencies, and design tokens wired up, so that subsequent sub-phases can build on a working baseline.

#### Acceptance Criteria

1. THE Peprin project SHALL contain a `lib/utils.ts` exporting a `cn` helper compatible with the existing `app/layout.tsx` import statement.
2. THE Peprin project SHALL define a top-level source layout under `app/` and `components/` that mirrors the source's logical groupings (`editor`, `timeline`, `preview`, `media`, `panels`, `effects`, `masks`, `stickers`, `text`, `subtitles`, `transcription`, `export`, `project`) without duplicating source code verbatim.
3. WHEN a developer runs `bun run dev` (or `npm run dev`) at the Peprin root, THE Next.js dev server SHALL start with Turbopack and serve the existing landing page at `/` without runtime errors.
4. WHEN a developer runs `bun run typecheck` (or `npm run typecheck`), THE TypeScript compiler SHALL succeed with zero errors against the scaffolded source.
5. THE Peprin project SHALL install only the Phase 1.1 dependencies enumerated in Requirement 13 (Library Installation Plan), deferring later-phase dependencies.
6. THE Peprin landing page at `/` SHALL be replaced by a Peprin-skinned hero that links to `/editor` and `/projects`, using only Design_Tokens for styling.
7. THE Peprin project SHALL configure a `next-themes` provider so the existing dark-mode toggle continues to function across all new pages.
8. THE Peprin project SHALL add a global error boundary and a `not-found.tsx` route, both styled with Design_Tokens.

### Requirement 2: Sub-Phase 1.2 — Project Management

**User Story:** As a user, I want to create, list, rename, duplicate, and delete editing projects, so that I can manage multiple compositions over time.

#### Acceptance Criteria

1. THE Peprin app SHALL expose a `/projects` route that lists all stored Projects.
2. WHEN a user clicks "New Project" on `/projects`, THE Peprin app SHALL create a new Project with a generated id, a default name, and an empty Timeline, and SHALL navigate to `/editor/{projectId}`.
3. WHEN a user opens `/editor/{projectId}` for an existing Project, THE Peprin app SHALL load that Project's state from the configured storage layer.
4. WHEN a user renames a Project from `/projects`, THE Peprin app SHALL persist the new name and reflect it in the list.
5. WHEN a user duplicates a Project from `/projects`, THE Peprin app SHALL create an independent copy with a new id and the same Timeline, Media_Library references, and effect graph.
6. WHEN a user deletes a Project from `/projects`, THE Peprin app SHALL remove the Project and any storage entries owned exclusively by that Project, after a confirmation dialog.
7. IF the configured storage layer fails to load or save a Project, THEN THE Peprin app SHALL surface a non-blocking toast describing the failure and SHALL NOT silently discard user work.
8. THE Peprin app SHALL persist Project metadata (id, name, createdAt, updatedAt, thumbnail) and Project content (tracks, clips, effects, masks, text, subtitles) to the storage layer selected in Requirement 14 (Storage Mode Decision).

### Requirement 3: Sub-Phase 1.3 — Media Import and Library

**User Story:** As a user, I want to import video, audio, and image files and see them in a media library, so that I can drag them onto the timeline.

#### Acceptance Criteria

1. THE Editor SHALL provide a Media_Library panel that lists all assets imported into the current Project.
2. WHEN a user drops a file matching a supported MIME type (video/mp4, video/webm, video/quicktime, audio/wav, audio/mpeg, audio/aac, image/png, image/jpeg, image/webp, image/gif) onto the Media_Library, THE Peprin app SHALL ingest the file and add an entry to the Media_Library.
3. WHEN a user clicks an "Import" button in the Media_Library, THE Peprin app SHALL open a file picker accepting the same MIME types listed in 3.2.
4. WHEN a video or image is imported, THE Peprin app SHALL generate a thumbnail using OffscreenCanvas or HTMLVideoElement frame capture, and SHALL display the thumbnail in the Media_Library entry.
5. WHEN an audio file is imported, THE Peprin app SHALL generate a waveform preview using `wavesurfer.js` or an equivalent TypeScript renderer, and SHALL display the waveform in the Media_Library entry.
6. WHEN a media asset is imported, THE Peprin app SHALL extract and store its duration, width, height (where applicable), sample rate, channel count, and codec metadata using `mediabunny`.
7. IF an imported file exceeds a configured size limit (default 2 GiB) or fails metadata extraction, THEN THE Peprin app SHALL reject the import and SHALL display a descriptive error.
8. THE Media_Library SHALL persist asset binaries and metadata according to the storage mode selected in Requirement 14, using OPFS for binaries in Local_First_Mode.

### Requirement 4: Sub-Phase 1.4 — Timeline

**User Story:** As a user, I want a multi-track timeline where I can arrange, trim, split, ripple, and reorder clips, so that I can build a video composition over time.

#### Acceptance Criteria

1. THE Timeline SHALL render a horizontally scrollable, vertically stacked set of Tracks with a time ruler at the top.
2. THE Timeline SHALL support at least the following Track types: video, audio, text, sticker, subtitle.
3. WHEN a user drags a Media_Library entry onto the Timeline, THE Peprin app SHALL create a Clip on the appropriate Track type at the drop position.
4. WHEN a user drags a Clip horizontally, THE Peprin app SHALL move the Clip in time and update its start position.
5. WHEN a user drags a Clip's left or right edge, THE Peprin app SHALL trim the Clip's in-point or out-point without altering the underlying media asset.
6. WHEN a user invokes "Split" with the playhead intersecting a Clip, THE Peprin app SHALL divide the Clip into two adjacent Clips at the playhead position.
7. WHEN a user enables ripple mode and deletes or trims a Clip, THE Peprin app SHALL shift all later Clips on the same Track to close or open the resulting gap.
8. WHEN a user drags a Track header vertically, THE Peprin app SHALL reorder Tracks and update their z-order in the preview.
9. THE Timeline SHALL support snapping to: other Clip edges, the playhead, the Project start, and configurable grid intervals.
10. THE Timeline SHALL support zoom in/out via keyboard shortcut, mouse wheel with modifier, and a zoom slider, ranging from at least 1 px/second to 500 px/second.
11. WHEN a user selects one or more Clips, THE Peprin app SHALL highlight selection using Design_Tokens and SHALL expose selection state to the Inspector and Commands subsystems.
12. THE Timeline SHALL render a virtualized view of Clips so that Projects with at least 1000 Clips remain interactive at 60 fps on a mid-range laptop.

### Requirement 5: Sub-Phase 1.5 — Preview and Playback

**User Story:** As a user, I want a preview canvas that plays the composed timeline in real time, so that I can review my edits as I work.

#### Acceptance Criteria

1. THE Editor SHALL render a Preview canvas above the Timeline showing the composed frame at the current playhead time.
2. WHEN the user presses play, THE Peprin app SHALL advance the playhead at the Project frame rate and SHALL render each frame through the Compositor.
3. THE Compositor SHALL combine all visible Clips at the current time into a single output frame using TypeScript-only rendering as defined in Requirement A.
4. THE Compositor SHALL respect Track z-order, Clip in-point and out-point, and per-clip transforms (position, scale, rotation, opacity).
5. WHEN a user scrubs the playhead by dragging the Timeline ruler, THE Preview SHALL update to the corresponding frame within 100 ms on a mid-range laptop.
6. THE Preview SHALL support common playback controls: play, pause, frame-forward, frame-back, jump-to-start, jump-to-end, loop region.
7. WHEN audio Clips are present, THE Preview SHALL play their audio in sync with video through a Web Audio graph using `soundtouchjs` for pitch-preserving speed changes.
8. WHEN the Project frame rate is set, THE Preview SHALL render at that frame rate, capping at the display refresh rate where necessary.
9. THE Preview SHALL expose a "fit", "fill", and "100%" zoom mode and an aspect-ratio selector consistent with the source FPS module.
10. IF a Clip's source media is missing or fails to decode, THEN THE Preview SHALL render a placeholder frame using Design_Tokens and SHALL surface the error in the Diagnostics panel.

### Requirement 6: Sub-Phase 1.6 — Editing Tools

**User Story:** As a user, I want core editing tools (selection, transform, speed, retime, ripple, clipboard, commands), so that I can manipulate clips efficiently with keyboard and mouse.

#### Acceptance Criteria

1. THE Editor SHALL provide a Commands subsystem registering at minimum: undo, redo, cut, copy, paste, duplicate, delete, select-all, deselect, split, ripple-toggle, group, ungroup.
2. WHEN a user invokes undo, THE Peprin app SHALL revert the most recent state-changing command and SHALL restore the prior Project state.
3. WHEN a user invokes redo, THE Peprin app SHALL reapply the most recently undone command if the command stack has not been invalidated by a new edit.
4. THE Editor SHALL maintain an undo history of at least 100 commands per Project.
5. THE Editor SHALL provide a Selection subsystem supporting click-select, shift-click multi-select, marquee-select, and select-by-track.
6. WHEN one or more Clips are selected, THE Editor SHALL display an Inspector panel showing per-clip Params (position, scale, rotation, opacity, speed, volume, in-point, out-point) bound to the underlying Project state.
7. WHEN a user changes a Param in the Inspector, THE Editor SHALL update the Project state, the Preview, and the Timeline within 50 ms on a mid-range laptop.
8. THE Editor SHALL implement Speed and Retime per the source `speed/` and `retime/` modules, supporting linear speed change in the range 0.1x to 10x with pitch-preserving audio via `soundtouchjs`.
9. THE Editor SHALL implement clipboard operations using the source `clipboard/` model, supporting cross-Project paste of Clips and their referenced Media_Library entries.
10. THE Editor SHALL register at minimum the keyboard shortcuts: Space (play/pause), J/K/L (shuttle), Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+X/C/V/D (cut/copy/paste/duplicate), Delete (delete selection), S (split at playhead).

### Requirement 7: Sub-Phase 1.7 — Effects, Masks, and Stickers

**User Story:** As a user, I want to apply visual effects, masks, and stickers to clips, so that I can stylize and composite my video.

#### Acceptance Criteria

1. THE Effects module SHALL implement at least the following effect families in TypeScript: blur, color grade (brightness, contrast, saturation, hue, exposure), levels/curves, sharpen, vignette, chroma key, and grain.
2. WHEN an effect is added to a Clip, THE Compositor SHALL apply that effect during preview and export rendering.
3. THE Masks module SHALL support at least the following mask shapes in TypeScript: rectangle, ellipse, polygon, and free-form path, with feather and invert options.
4. WHEN a mask is added to a Clip, THE Compositor SHALL render the Clip only within the mask's alpha region.
5. THE Stickers module SHALL allow placing image-based and shape-based stickers on a sticker Track, with position, scale, rotation, opacity, and entry/exit animation Params.
6. THE Effects, Masks, and Stickers panels SHALL expose previews of available items using Design_Tokens, replacing any OpenCut-branded preview imagery.
7. WHEN an effect, mask, or sticker is animated via keyframes, THE Compositor SHALL interpolate Param values per the source `animation/` module's easing curves.
8. THE Compositor SHALL execute effect chains using WebGL2 shaders or WebGPU compute pipelines where pixel-level work is required, falling back to Canvas2D for low-cost effects.
9. WHERE the source uses WebAssembly-accelerated Gaussian blur, color science (`culori`), or gradient generation, THE Peprin implementation SHALL implement equivalent functionality in pure TypeScript using `culori` and shader code.

### Requirement 8: Sub-Phase 1.8 — Text and Subtitles

**User Story:** As a user, I want to add text overlays and subtitle tracks to my composition, so that I can title my video and display captions.

#### Acceptance Criteria

1. THE Text module SHALL allow creating a text Clip with editable content, font family, font weight, size, color, alignment, line height, letter spacing, stroke, shadow, and background.
2. WHEN a text Clip is rendered, THE Compositor SHALL rasterize the text using OffscreenCanvas with `CanvasRenderingContext2D.fillText` (or a font sprite atlas where the source uses one), reproducing the source `fonts/` module's behavior in TypeScript.
3. THE Text module SHALL provide a curated font catalog drawing from Google Fonts or system fonts, with on-demand loading via `next/font` or the FontFace API.
4. THE Subtitles module SHALL allow importing SRT and VTT files into a subtitle Track and SHALL allow exporting the subtitle Track to SRT and VTT.
5. WHEN a subtitle entry is rendered, THE Compositor SHALL position the entry at the user-configured anchor (top, middle, bottom) and SHALL respect per-entry style overrides.
6. THE Subtitles module SHALL provide a transcript-style editor for editing entry text and timing, with snap-to-clip-edge behavior.
7. WHEN a Subtitle round-trip is performed (parse SRT → edit → serialize SRT), THE serialized output SHALL parse back to a structurally equivalent subtitle Track.
8. WHEN a Subtitle round-trip is performed for VTT, THE serialized output SHALL parse back to a structurally equivalent subtitle Track.

### Requirement 9: Sub-Phase 1.9 — Audio

**User Story:** As a user, I want per-clip audio controls, mixing, and waveform display, so that I can balance audio across my composition.

#### Acceptance Criteria

1. THE Audio subsystem SHALL render a waveform on every audio Clip using `wavesurfer.js` or a TypeScript-equivalent renderer.
2. THE Audio subsystem SHALL expose per-clip volume, mute, pan, and fade-in/fade-out Params.
3. WHEN audio Clips overlap in time on the same or different audio Tracks, THE Audio subsystem SHALL mix them through a Web Audio graph during Preview playback.
4. WHEN a Speed Param is applied to an audio Clip, THE Audio subsystem SHALL preserve pitch using `soundtouchjs`.
5. THE Audio subsystem SHALL support adding a master Track-level gain and a project-level master output gain.
6. THE Audio subsystem SHALL detect clipping (output exceeding 0 dBFS) and SHALL display a non-blocking warning in the Diagnostics panel.

### Requirement 10: Sub-Phase 1.10 — Transcription

**User Story:** As a user, I want to transcribe an audio track to a subtitle track in the browser, so that I can generate captions without uploading audio to a server.

#### Acceptance Criteria

1. THE Transcription module SHALL run `@huggingface/transformers` in a Web Worker so that the main thread remains responsive.
2. WHEN a user invokes "Transcribe Track" on an audio Track, THE Transcription module SHALL stream progress updates to the UI.
3. WHEN transcription completes, THE Transcription module SHALL produce a subtitle Track aligned to the source audio Track's timeline.
4. THE Transcription module SHALL allow selecting a model (default: small multilingual Whisper variant suitable for browser execution) and a target language.
5. IF transcription fails (model load error, decoding error, out-of-memory), THEN THE Transcription module SHALL surface a descriptive error and SHALL NOT corrupt the existing subtitle Track.
6. WHEN the resulting subtitle Track is exported to SRT or VTT, THE round-trip property defined in Requirement 8.7 and 8.8 SHALL hold.
7. WHERE the user's device exposes WebGPU, THE Transcription module SHALL prefer the WebGPU backend of `@huggingface/transformers`; otherwise, THE Transcription module SHALL fall back to WASM-SIMD execution within the worker (the model runtime, not the editor compositor).

### Requirement 11: Sub-Phase 1.11 — Export

**User Story:** As a user, I want to export my composition to a downloadable video file, so that I can share my edited result.

#### Acceptance Criteria

1. THE Export module SHALL produce an MP4 (H.264 + AAC) output using `mediabunny` and WebCodecs.
2. THE Export module SHALL produce a WebM (VP9 + Opus) output using `mediabunny` and WebCodecs.
3. THE Export module SHALL produce an animated GIF output and a PNG image sequence output for compositions up to a configured maximum duration.
4. WHEN a user starts an Export, THE Export module SHALL render frames through the same Compositor used by the Preview, ensuring visual parity between Preview and Export.
5. WHEN a user starts an Export, THE Export module SHALL display a progress indicator with frames-rendered, frames-total, and estimated-time-remaining.
6. WHEN an Export completes, THE Peprin app SHALL trigger a browser download of the output file.
7. WHEN an Export is cancelled, THE Export module SHALL stop encoding within 1 second and SHALL release all encoder and decoder resources.
8. IF the user's browser lacks WebCodecs support for the requested codec, THEN THE Export module SHALL surface a descriptive error listing supported alternatives.
9. THE Export module SHALL support a configurable resolution, frame rate, and bitrate, with sensible defaults derived from the Project settings.

### Requirement 12: Sub-Phase 1.12 — Static Pages and Marketing Surface

**User Story:** As the project owner, I want the public-facing static pages from the source rebuilt with Peprin's identity, so that the site has the same informational surface area without copying OpenCut copy.

#### Acceptance Criteria

1. THE Peprin app SHALL provide routes equivalent to the source's `blog`, `changelog`, `contributors`, `roadmap`, `sponsors`, `brand`, `privacy`, and `terms` pages, scoped per Requirement 15 (Static Pages Decision).
2. WHERE Static_Pages are included, THE Peprin app SHALL author them with original Peprin copy and Design_Tokens; the source's marketing copy and imagery SHALL NOT be reproduced verbatim.
3. WHERE Static_Pages are included, THE Peprin app SHALL use `react-markdown`, `unified`, and the rehype/remark plugins listed in Requirement 13 to render markdown content from a Peprin-owned `content/` directory.
4. WHERE Static_Pages are included, THE Peprin app SHALL serve an `rss.xml` feed for blog and changelog updates using the `feed` package.
5. WHERE Static_Pages are included, THE Peprin app SHALL serve a `sitemap.xml` and `robots.txt` covering the Static_Pages and the editor entry points.

### Requirement 13: Library Installation Plan

**User Story:** As a developer, I want a clear, sub-phase-aligned dependency plan, so that I install only what each sub-phase needs and avoid unused packages.

#### Acceptance Criteria

1. THE Phase 1.1 install set SHALL include: `zustand`, `nanoid`, `eventemitter3`, `clsx`, `tailwind-merge`, `class-variance-authority`, `cmdk`, `sonner`, `react-resizable-panels`, `react-window`, `react-hook-form`, `zod`, `react-icons` (only if Phosphor cannot cover an icon), and the Radix primitives already needed by shadcn (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-select`, `@radix-ui/react-checkbox`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `@radix-ui/react-accordion`).
2. THE Phase 1.3 install set SHALL include: `mediabunny`, `wavesurfer.js`.
3. THE Phase 1.4 install set SHALL include: `@hello-pangea/dnd` (or an equivalent already in Peprin), `use-deep-compare-effect`.
4. THE Phase 1.6 install set SHALL include: `soundtouchjs`.
5. THE Phase 1.7 install set SHALL include: `culori`, `@types/culori`, `motion`.
6. THE Phase 1.8 install set SHALL include: `input-otp` only if user authentication is enabled per Requirement 14; otherwise THE install SHALL omit it.
7. THE Phase 1.10 install set SHALL include: `@huggingface/transformers`.
8. THE Phase 1.11 install set SHALL include: any additional WebCodecs polyfill or muxer dependencies surfaced by the Design phase; `mediabunny` is reused from 1.3.
9. THE Phase 1.12 install set SHALL include: `react-markdown`, `unified`, `rehype-autolink-headings`, `rehype-parse`, `rehype-sanitize`, `rehype-slug`, `rehype-stringify`, `feed`, and (only if a date picker is required for changelog filtering) `react-day-picker`.
10. THE Peprin install plan SHALL deliberately exclude the following source dependencies: `opencut-wasm` (replaced by TypeScript per Requirement A), `@hugeicons/react` (replaced by `@phosphor-icons/react`), `lucide-react` (replaced by `@phosphor-icons/react` unless a specific icon is unavailable), `@napi-rs/canvas` and `sharp` (server-side image tooling, not needed in the browser-only editor), `botid` (anti-bot service tied to source backend), `cross-env` (Peprin scripts use bun/node directly).
11. THE Peprin install plan SHALL include `next-themes` (already present), and SHALL NOT add `tailwindcss-animate` because Peprin already uses `tw-animate-css`.
12. THE Phase 1.2 install set SHALL include `idb` (IndexedDB wrapper) when Local_First_Mode is selected per Requirement 14; otherwise THE install set SHALL include `drizzle-orm`, `drizzle-kit`, `pg`, `postgres`, `better-auth`, `@upstash/redis`, and `@upstash/ratelimit`.

### Requirement 14: Storage Mode Decision

**User Story:** As the project owner, I need to choose between a local-first storage approach and a full backend stack, so that the rest of Phase 1 can be designed against a single, consistent storage model.

**Open question to resolve before Design phase**: The user previously stated "web based only," which is consistent with both modes. The default proposed by this requirement is Local_First_Mode for Phase 1, with Backend_Mode deferred. The user may override this default during requirements review.

#### Acceptance Criteria

1. THE Peprin Phase 1 plan SHALL operate in exactly one of two storage modes: Local_First_Mode (default) or Backend_Mode.
2. WHERE Local_First_Mode is selected, THE Peprin app SHALL persist Project metadata to IndexedDB via `idb`, SHALL persist media binaries to OPFS, and SHALL NOT include `better-auth`, `drizzle-orm`, `pg`, `postgres`, `@upstash/redis`, `@upstash/ratelimit`, or any database migration tooling.
3. WHERE Local_First_Mode is selected, THE Peprin app SHALL omit any user authentication UI, SHALL treat the local browser profile as the single user identity, and SHALL provide a Project export/import flow (download/upload a `.peprin` zip) for portability.
4. WHERE Backend_Mode is selected, THE Peprin app SHALL adopt the source backend stack: Drizzle ORM with Postgres, Better-Auth for authentication, Upstash Redis for rate limiting, and the source's migration files as a starting schema (rebranded fields where applicable).
5. WHERE Backend_Mode is selected, THE Peprin app SHALL include sign-up, sign-in, sign-out, and account-management routes, with all UI skinned per Requirement B.
6. WHERE Backend_Mode is selected, THE Peprin app SHALL store media binaries in object storage (target: Cloudflare R2 or equivalent S3-compatible service) and SHALL store only references in Postgres.
7. THE Design phase SHALL document the chosen storage mode and SHALL NOT mix modes within a single sub-phase.

### Requirement 15: Static Pages Inclusion Decision

**User Story:** As the project owner, I need to decide whether Phase 1 includes the public marketing pages or stops at editor-only, so that Sub-Phase 1.12 has a defined scope.

**Open question to resolve before Design phase**: Default proposed by this requirement is "Editor-only for Phase 1" with Static_Pages deferred to Phase 3 polish. The user may override this default during requirements review.

#### Acceptance Criteria

1. THE Peprin Phase 1 plan SHALL declare Sub-Phase 1.12 as either "included" (full Static_Pages set) or "deferred" (no Static_Pages, only the landing page from Sub-Phase 1.1).
2. WHERE Sub-Phase 1.12 is deferred, THE Peprin Phase 1 plan SHALL omit dependencies listed in Requirement 13.9 except those reused for in-editor markdown rendering (if any).
3. WHERE Sub-Phase 1.12 is included, THE Peprin Phase 1 plan SHALL implement all routes listed in Requirement 12.1.

### Requirement 16: Compositor Backend Decision

**User Story:** As the project owner, I need to decide on the rendering backend strategy for the Compositor, so that Sub-Phases 1.5, 1.7, and 1.11 can be designed against a single rendering pipeline.

**Open question to resolve before Design phase**: Default proposed by this requirement is "Canvas2D + WebGL2 hybrid" — Canvas2D for 2D layout, text, and stickers; WebGL2 for pixel effects and masks. WebGPU is treated as a progressive enhancement that the Compositor may use when available but does not require. The user may override this default during requirements review.

#### Acceptance Criteria

1. THE Compositor SHALL adopt one of three backend strategies: (a) Canvas2D-only for the first pass, (b) Canvas2D + WebGL2 hybrid (default), or (c) WebGPU-first with WebGL2 fallback.
2. WHERE the Canvas2D + WebGL2 hybrid is selected, THE Compositor SHALL render text, stickers, and basic transforms via Canvas2D, and SHALL render pixel effects (blur, color grade, chroma key, masks) via WebGL2 fragment shaders.
3. WHERE the WebGPU-first strategy is selected, THE Compositor SHALL feature-detect WebGPU and SHALL fall back to WebGL2 when unavailable, with no behavioral difference visible to the user beyond performance.
4. THE Compositor SHALL execute its render loop on an OffscreenCanvas in a dedicated Web Worker where the chosen backend supports it; otherwise THE Compositor SHALL run on the main thread with cooperative scheduling.
5. THE Design phase SHALL document the chosen backend and SHALL define the shared frame-rendering interface used by both Preview (Sub-Phase 1.5) and Export (Sub-Phase 1.11) to guarantee parity per Requirement 11.4.

---

## Out of Scope (Phase 2 and Phase 3)

The following are explicitly out of scope for this spec and SHALL NOT be implemented as part of Phase 1:

- HeyGen integration: avatar generation, voice synthesis, AI-driven clip generation. (Phase 2)
- AI assistants beyond browser-local transcription. (Phase 2)
- Cross-browser end-to-end testing matrix, accessibility audit, performance budget enforcement, public release. (Phase 3)
- Native desktop app (`apps/desktop` in the source). (Out of scope entirely; Peprin is web-only.)
- Server-side rendering pipelines (`@napi-rs/canvas`, `sharp`). (Out of scope; rendering is browser-only.)

Subphase    Status
1.1    Foundations (deps, primitives, providers)    ✅ Done
1.2    Marketing shell (header, footer, hero, static pages)    done
1.3    Projects page + storage layer (Dexie/IndexedDB)    done
1.4    Editor shell (route, resizable panels, header)    done
1.5    Media panel (import drag/drop, library, thumbnails)    done
1.6    Preview canvas (transport, compositor, scrub)    ✅ Done
1.7    Timeline (tracks, clips, playhead, zoom, snap)    ✅ Done
1.8    Inspector / properties panel    ⏳ Pending
1.9    Core ops (split/trim/delete, ripple, copy/paste, undo/redo, shortcuts)    ⏳ Pending
1.10    Text + stickers + transitions/effects (basic set)    ⏳ Pending
1.11    Audio waveform + subtitles UI    ⏳ Pending
1.12    Export via mediabunny (MP4/WebM)    ⏳ Pending
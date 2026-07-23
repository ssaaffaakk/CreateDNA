# CreateDNA — Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Project overview

**CreateDNA** is an IBM AI Builders Challenge hackathon project.  
Users upload portfolio images → watsonx.ai vision (Llama 4 Maverick) extracts a "Creative DNA" → uploads accumulate into a growing style profile → users enter a project brief → IBM Granite (granite-4-h-small) generates a persona-matched project kit.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 with localStorage persistence |
| Animations | Framer Motion 12 |
| Text AI | IBM Granite 4 H Small (`ibm/granite-4-h-small`) |
| Vision AI | Llama 4 Maverick (`meta-llama/llama-4-maverick-17b-128e-instruct-fp8`) |
| AI transport | watsonx.ai `/ml/v1/text/chat` REST API via native `fetch` |

## File map

```
src/
  app/
    page.tsx             # Single-page UI — landing, upload, DNA, kit
    layout.tsx           # Root layout, metadata, OpenGraph
    global-error.tsx     # Recovery screen with a "Clear saved data" escape hatch
    globals.css          # Tailwind v4 directives, accent + cool tokens, reduced motion
    api/
      analyze/route.ts   # POST /api/analyze — vision model + mergeStyleDNA
      generate/route.ts  # POST /api/generate — Granite text → project kit
      export/route.ts    # POST /api/export   — JSON / Markdown / system-prompt
  components/
    UploadZone.tsx        # Drag-drop + click upload, validation, retry, thumbnails
    StyleDNAPanel.tsx     # Visual display of merged StyleDNA with animated tags/bars
    ProjectBriefForm.tsx  # Brief input → /api/generate, retry on failure
    OutputPanel.tsx       # Project kit display + copy buttons + export downloads
  lib/
    granite.ts            # IAM token cache + fetch-based watsonx chat client
    store.ts              # Zustand store + persisted-schema version/migrate
    style-dna.ts          # StyleDNA types, ANALYSIS_PROMPT, mergeStyleDNA logic
    api-error.ts          # Maps upstream errors to safe client messages
    request-guard.ts      # Body-size rejection + prompt-string clamping
    mock-data.ts          # Demo mode sample data for judges without API keys
```

## Persisted state rules

- `localStorage` is **untrusted input** — it may hold a shape written by an
  older build. Everything read from it goes through `sanitizePersisted` in
  `store.ts` before reaching a component.
- Bump `PERSIST_VERSION` on any breaking change to the persisted shape.
  Zustand stamps blobs `version: 0` by default, so a `migrate` never runs
  unless the version is bumped.
- Never persist transient UI state. `partialize` deliberately excludes
  `isAnalyzing` and `error`; persisting `isAnalyzing` once left the uploader
  permanently blocked after a reload.

## Motion rules

- Product content (DNA profile, project kit, landing) must be visible without
  waiting for an animation frame — use `initial={false}`. A background tab
  stops rAF, and a stalled frame would otherwise leave the page blank.
- Never gate a conditional render's disappearance on an exit animation.
- Keep motion that carries data (palette bar fill, style weight bars);
  drop motion that only decorates.

## Environment variables

All required in `.env.local` (never commit this file):

```
WATSONX_API_KEY=      # IBM Cloud IAM API key
WATSONX_PROJECT_ID=   # watsonx.ai project ID
WATSONX_URL=          # e.g. https://eu-de.ml.cloud.ibm.com — must match WML service region
```

## watsonx.ai API rules

- **IAM auth only.** Exchange `WATSONX_API_KEY` for a Bearer token at `https://iam.cloud.ibm.com/identity/token`. Tokens last 1 hour. Cache with a 5-minute buffer.
- **Endpoint:** `POST {WATSONX_URL}/ml/v1/text/chat?version=2025-03-01`. Pass `project_id` in the **request body** (not the query string) alongside `model_id` and `messages`.
- **Model IDs:** `ibm/granite-4-h-small` (text), `meta-llama/llama-4-maverick-17b-128e-instruct-fp8` (vision). Defined as constants at the top of `granite.ts`.
- **Region matters.** The WML service, project, and models must all be in the same region (`WATSONX_URL`). Granite chat/vision availability differs per region and plan — the Lite plan does not offer `granite-vision-4-1-4b` or `granite-4-1-8b-instruct`.
- **Transport:** native `fetch` against the watsonx `/text/chat` endpoint. The OpenAI SDK's `/chat/completions` path shape does not match watsonx, so it is not used.
- Do **not** use an API key directly as the Bearer token — watsonx requires IAM token exchange.
- The WML service instance must be **associated with the project** or calls fail with `no_associated_service_instance_error`.

## Coding rules

1. Every component in `src/components/` must be a Client Component (`"use client"`).
2. All AI calls go through `src/lib/granite.ts` — never call watsonx directly from components.
3. API routes in `src/app/api/` are Server Components — never import client-only code there.
4. State mutations go through the Zustand store (`useAppStore`). Do not use `useState` for shared data.
5. JSON responses from the models may include markdown fences — always strip with `/\{[\s\S]*\}/` before `JSON.parse`.
6. The `StyleDNA` type is the canonical shape for all style data. Never extend it ad-hoc.
7. Model IDs live only as constants in `granite.ts` (`TEXT_MODEL`, `VISION_MODEL`). Never hardcode a model ID in a route or component.

## Commit discipline

After **every meaningful change**, commit and push:

```bash
git add . && git commit -m "feat: <what changed>" && git push origin main
```

Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## Features implemented

- Upload with drag-drop, file type/size validation, retry on failure
- Vision analysis (Llama 4 Maverick) with JSON parsing and error recovery
- Weighted DNA merge algorithm with color proximity detection
- Animated DNA panel (palette swatches with copy feedback, style bars, tag badges)
- Consistency score calculated from style weight entropy
- Project kit generation with full DNA context in system prompt
- Ready-to-use prompts for Midjourney, DALL-E, ChatGPT, Canva
- Export as JSON, Markdown style guide, or portable system prompt
- Demo mode with sample data for judges without API credentials
- Dark mode support, mobile responsive, prefers-reduced-motion
- AnimatePresence transitions between app states
- Server-side input validation (body size, field length, response shape)
- Client-side downscale to 1024px before upload — ~84% smaller payload
- Landing shows a real example profile so the product demonstrates itself
- Versioned persisted state with sanitising migrate + recovery screen
- Full keyboard operation (dropzone, palette swatches, labelled controls)

## Known bugs / gotchas (all fixed)

- `StyleDNAPanel.tsx` previously rendered `styleDNA.mood` instead of `styleDNA.techniques` in the Techniques section — **fixed**.
- `granite.ts` previously used the OpenAI SDK with `project_id` in the query string — watsonx requires `project_id` in the request body and uses a `/text/chat` path (not `/chat/completions`). **Fixed** by switching to native `fetch`.
- `tokenExpiry` was set to `3500 * 1000` ms (wrong units — that's 58 minutes in milliseconds but expressed as if multiplying seconds). **Fixed** to `55 * 60 * 1000` ms.
- Granite 4.1 chat/vision models (`granite-vision-4-1-4b`, `granite-4-1-8b-instruct`) return `model_not_supported` on the Lite plan. **Fixed** by moving to `granite-4-h-small` (text) and `llama-4-maverick` (vision).

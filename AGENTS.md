# CreativeDNA — Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Project overview

**CreativeDNA** is an IBM AI Builders Challenge hackathon project.  
Users upload portfolio images → IBM Granite Vision 4.1-4b extracts a "Creative DNA" → uploads accumulate into a growing style profile → users enter a project brief → Granite 4.1-8b-instruct generates a persona-matched project kit.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 with localStorage persistence |
| Animations | Framer Motion 12 |
| Vision AI | IBM Granite Vision 4.1-4b (`ibm/granite-vision-4-1-4b`) |
| Text AI | IBM Granite 4.1-8b-instruct (`ibm/granite-4-1-8b-instruct`) |
| AI transport | watsonx.ai OpenAI-compatible API via `openai` npm package |

## File map

```
src/
  app/
    page.tsx             # Single-page UI — four panels wired together
    layout.tsx           # Root layout, metadata
    api/
      analyze/route.ts   # POST /api/analyze — Granite Vision + mergeStyleDNA
      generate/route.ts  # POST /api/generate — Granite text → project kit
      export/route.ts    # POST /api/export   — JSON / Markdown / system-prompt
  components/
    UploadZone.tsx        # Drag-drop + click upload, base64 → API → store
    StyleDNAPanel.tsx     # Visual display of merged StyleDNA profile
    ProjectBriefForm.tsx  # Brief input → /api/generate
    OutputPanel.tsx       # Project kit display + export buttons
  lib/
    granite.ts            # IAM token cache + OpenAI-compat client for watsonx
    store.ts              # Zustand store (StyleDNA, images, project, output)
    style-dna.ts          # StyleDNA types, ANALYSIS_PROMPT, mergeStyleDNA logic
```

## Environment variables

All required in `.env.local` (never commit this file):

```
WATSONX_API_KEY=      # IBM Cloud IAM API key
WATSONX_PROJECT_ID=   # watsonx.ai project ID
WATSONX_URL=          # e.g. https://us-south.ml.cloud.ibm.com
```

## watsonx.ai API rules

- **IAM auth only.** Exchange `WATSONX_API_KEY` for a Bearer token at `https://iam.cloud.ibm.com/identity/token`. Tokens last 1 hour. Cache with a 5-minute buffer.
- **Endpoint:** `POST {WATSONX_URL}/ml/v1/text/chat?version=2025-03-01&project_id={WATSONX_PROJECT_ID}`
- **Model IDs** use the `ibm/` prefix: `ibm/granite-vision-4-1-4b`, `ibm/granite-4-1-8b-instruct`.
- **OpenAI SDK usage:** Set `baseURL` to `.../ml/v1/text` (no query params in baseURL). Pass `version` and `project_id` via `defaultQuery` so the SDK can append `/chat/completions` correctly.
- Do **not** use an API key directly as the Bearer token — watsonx requires IAM token exchange.

## Coding rules

1. Every component in `src/components/` must be a Client Component (`"use client"`).
2. All AI calls go through `src/lib/granite.ts` — never call watsonx directly from components.
3. API routes in `src/app/api/` are Server Components — never import client-only code there.
4. State mutations go through the Zustand store (`useAppStore`). Do not use `useState` for shared data.
5. JSON responses from Granite may include markdown fences — always strip with `/\{[\s\S]*\}/` before `JSON.parse`.
6. The `StyleDNA` type is the canonical shape for all style data. Never extend it ad-hoc.

## Commit discipline

After **every meaningful change**, commit and push:

```bash
git add . && git commit -m "feat: <what changed>" && git push origin main
```

Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`.

## Known bugs / gotchas

- `StyleDNAPanel.tsx` previously rendered `styleDNA.mood` instead of `styleDNA.techniques` in the Techniques section — **fixed**.
- `granite.ts` previously used `/ml/v1beta/text/chat` with query params embedded in `baseURL` — broken URL construction. **Fixed** to `/ml/v1/text` + `defaultQuery`.
- `tokenExpiry` was set to `3500 * 1000` ms (wrong units — that's 58 minutes in milliseconds but expressed as if multiplying seconds). **Fixed** to `55 * 60 * 1000` ms.

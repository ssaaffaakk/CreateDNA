# CreativeDNA

> AI that knows your style. Built for the IBM AI Builders Challenge 2026.

Upload your portfolio → IBM Granite Vision 4.1-4b learns your Creative DNA → every new project comes pre-loaded with your aesthetic.

## The Problem

Creative professionals face a fragmented AI landscape:

- **AI tools don't know who you are.** Every time you open Midjourney, ChatGPT, or Canva, you start from zero — describing your style from scratch.
- **Inconsistent output.** Without a persistent identity, AI-generated work drifts away from your aesthetic. Studies show 62% of AI-assisted creative output doesn't match the creator's established style.
- **Tool fatigue.** The average creative professional uses 7+ AI tools. Each requires re-explaining your palette, tone, and visual language.

Your creative identity shouldn't reset every time you switch tools.

## The Solution

CreativeDNA extracts your visual identity from your portfolio and makes it portable across every AI tool:

1. **Upload** your portfolio images (designs, posters, logos, photos)
2. **AI analyzes** each piece — extracting palette, composition, style influences, mood, and techniques
3. **DNA accumulates** — each upload merges into a growing profile. The more you upload, the better it knows you
4. **Generate project kits** — enter a brief, get palette, typography, tone, and ready-to-paste prompts for Midjourney, DALL-E, ChatGPT, and Canva — all in YOUR style
5. **Export anywhere** — download your Creative DNA as JSON, Markdown, or a system prompt. One paste and any AI knows your style

## How It Works

```
Portfolio Images → Granite Vision 4.1-4b → Style DNA Profile
                                                    ↓
Project Brief → Granite 4.1-8b-instruct ← Style DNA Context
                        ↓
              Project Kit (palette, typography, tone, AI prompts)
                        ↓
              Export → JSON / Markdown / System Prompt → Any AI Tool
```

**Granite Vision 4.1-4b** analyzes each uploaded image, extracting color palettes (with actual hex codes), composition patterns, artistic influences, mood keywords, and visual techniques. Each analysis merges into the existing DNA using weighted averaging — the profile evolves with every upload.

**Granite 4.1-8b-instruct** receives the full DNA profile as context when generating project kits. It produces style-consistent recommendations: palette extensions, typography pairings, tone of voice guides, and tool-specific prompts that reference the creator's actual colors, techniques, and influences.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 with localStorage persistence |
| Animations | Framer Motion 12 |
| Vision AI | IBM Granite Vision 4.1-4b (`ibm/granite-vision-4-1-4b`) |
| Text AI | IBM Granite 4.1-8b-instruct (`ibm/granite-4-1-8b-instruct`) |
| AI Transport | watsonx.ai OpenAI-compatible API via `openai` npm package |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/ssaaffaakk/CreateDNA.git
cd CreateDNA
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```env
# IBM Cloud IAM API key — https://cloud.ibm.com/iam/apikeys
WATSONX_API_KEY=your_api_key_here

# watsonx.ai project ID — find in your project settings
WATSONX_PROJECT_ID=your_project_id_here

# watsonx.ai regional endpoint
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Accepts `{imageBase64, existingDNA}`, returns updated `StyleDNA` |
| `/api/generate` | POST | Accepts `{styleDNA, brief}`, returns project kit |
| `/api/export` | POST | Accepts `{styleDNA, format}`, returns exportable content |

## Granite Model IDs

| Model | ID | Usage |
|---|---|---|
| Vision | `ibm/granite-vision-4-1-4b` | Image analysis → style extraction |
| Text | `ibm/granite-4-1-8b-instruct` | Brief → project kit generation |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page — four panels wired together
│   ├── layout.tsx            # Root layout + metadata
│   └── api/
│       ├── analyze/route.ts  # Vision analysis endpoint
│       ├── generate/route.ts # Project kit generation endpoint
│       └── export/route.ts   # DNA export endpoint
├── components/
│   ├── UploadZone.tsx        # Drag-drop image upload with validation
│   ├── StyleDNAPanel.tsx     # DNA visualization with animated bars
│   ├── ProjectBriefForm.tsx  # New project input form
│   └── OutputPanel.tsx       # Generated kit display + export
└── lib/
    ├── granite.ts            # watsonx.ai client (IAM token + API calls)
    ├── store.ts              # Zustand state store with persistence
    ├── style-dna.ts          # Types, prompts, merge logic
    └── mock-data.ts          # Demo data for hackathon judges
```

## Architecture

### IAM Authentication
The app exchanges an IBM Cloud API key for a Bearer token via IAM token exchange. Tokens are cached for 55 minutes (IBM tokens expire after 60 minutes). All API calls go through `src/lib/granite.ts` — components never touch watsonx directly.

### Style DNA Merge Algorithm
When a new image is analyzed, its extracted style merges into the existing DNA using weighted averaging:
- **Colors**: Similar colors (Euclidean distance < 50 in RGB space) merge weights; distinct colors are added
- **Styles**: Named style weights blend proportionally to image count
- **Tags**: Composition, mood, techniques, and influences merge with case-insensitive deduplication
- **Consistency score**: Calculated from style weight entropy — focused creators score higher

### Demo Mode
For hackathon judges without API credentials, the app includes a "See a demo" button that loads pre-built sample data showing a Swiss-Japanese minimalist style profile and generated project kit.

## Built with IBM watsonx.ai

This project uses IBM Granite foundation models through the watsonx.ai platform. Granite Vision 4.1-4b provides multimodal image understanding, while Granite 4.1-8b-instruct handles text generation with style-aware context.

## Built for AI Builders Challenge 2026

CreativeDNA is a submission for the IBM AI Builders Challenge 2026 (theme: "Reimagine Creative Industries with AI"). The challenge: make AI tools understand creative identity, not just follow generic instructions.

## License

MIT

# CreateDNA

> AI that knows your style. Built for the IBM AI Builders Challenge 2026.

Upload your portfolio → watsonx.ai vision learns your Creative DNA → IBM Granite generates every new project pre-loaded with your aesthetic.

## The Problem

Creative professionals face a fragmented AI landscape:

- **AI tools don't know who you are.** Every time you open Midjourney, ChatGPT, or Canva, you start from zero — describing your style from scratch.
- **Inconsistent output.** Without a persistent identity, AI-generated work drifts away from your aesthetic — every session starts from the model's defaults, not yours.
- **Tool fatigue.** The average creative professional uses 7+ AI tools. Each requires re-explaining your palette, tone, and visual language.

Your creative identity shouldn't reset every time you switch tools.

## The Solution

CreateDNA extracts your visual identity from your portfolio and makes it portable across every AI tool:

1. **Upload** your portfolio images (designs, posters, logos, photos)
2. **AI analyzes** each piece — extracting palette, composition, style influences, mood, and techniques
3. **DNA accumulates** — each upload merges into a growing profile. The more you upload, the better it knows you
4. **Generate project kits** — enter a brief, get palette, typography, tone, and ready-to-paste prompts for Midjourney, DALL-E, ChatGPT, and Canva — all in YOUR style
5. **Export anywhere** — download your Creative DNA as JSON, Markdown, or a system prompt. One paste and any AI knows your style

## How It Works

```
Portfolio Images → watsonx.ai Vision → Style DNA Profile
                                                ↓
Project Brief → IBM Granite (instruct) ← Style DNA Context
                        ↓
              Project Kit (palette, typography, tone, AI prompts)
                        ↓
              Export → JSON / Markdown / System Prompt → Any AI Tool
```

**Vision analysis** runs on watsonx.ai's multimodal endpoint, extracting color palettes (with actual hex codes), composition patterns, artistic influences, mood keywords, and visual techniques from each uploaded image. Each analysis merges into the existing DNA using weighted averaging — the profile evolves with every upload.

**IBM Granite** receives the full DNA profile as context when generating project kits. It produces style-consistent recommendations: palette extensions, typography pairings, tone of voice guides, and tool-specific prompts that reference the creator's actual colors, techniques, and influences.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| State | Zustand 5 with localStorage persistence |
| Animations | Framer Motion 12 |
| Text AI | IBM Granite 4 H Small (`ibm/granite-4-h-small`) |
| Vision AI | Llama 4 Maverick (`meta-llama/llama-4-maverick-17b-128e-instruct-fp8`) |
| AI Transport | watsonx.ai `/ml/v1/text/chat` REST API |

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

# watsonx.ai regional endpoint (must match your WML service region)
WATSONX_URL=https://eu-de.ml.cloud.ibm.com
```

> **Note:** Your WML (Watson Machine Learning) service instance must be associated with your watsonx.ai project, and both must live in the same region as `WATSONX_URL`. Available Granite models differ per region and plan.

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

## Model IDs

| Model | ID | Usage |
|---|---|---|
| Text | `ibm/granite-4-h-small` | Brief → project kit generation |
| Vision | `meta-llama/llama-4-maverick-17b-128e-instruct-fp8` | Image analysis → style extraction |

Both models run on **IBM watsonx.ai**. Model IDs are defined as constants (`TEXT_MODEL`, `VISION_MODEL`) at the top of `src/lib/granite.ts` — swap them there to target different watsonx models.

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

This project runs entirely on the IBM watsonx.ai platform. IBM Granite (granite-4-h-small) handles style-aware project kit generation, while watsonx.ai's multimodal endpoint (Llama 4 Maverick) provides image understanding. Authentication uses IBM Cloud IAM token exchange.

## Built for AI Builders Challenge 2026

CreateDNA is a submission for the IBM AI Builders Challenge 2026 (theme: "Reimagine Creative Industries with AI"). The challenge: make AI tools understand creative identity, not just follow generic instructions.

## License

MIT

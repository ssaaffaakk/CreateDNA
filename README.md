# CreativeDNA

> AI that knows your style. Built for the IBM AI Builders Challenge 2026.

Upload your portfolio → IBM Granite Vision 4.1-4b learns your Creative DNA → every new project comes pre-loaded with your aesthetic.

## What it does

1. **Upload** — Drop your portfolio images (designs, posters, logos, photos).
2. **Analyze** — IBM Granite Vision 4.1-4b extracts your color palette, composition style, artistic influences, mood, and techniques from each image.
3. **Accumulate** — Each upload merges into a growing DNA profile. The more you upload, the better it knows you.
4. **Brief** — Enter a new project brief (what you're making, platform, audience, constraints).
5. **Generate** — IBM Granite 4.1-8b-instruct produces a full project kit *in your style*: palette, typography, tone of voice, and ready-to-paste prompts for Midjourney, DALL-E, ChatGPT, and Canva.
6. **Export** — Download your Creative DNA as JSON, Markdown, or a system prompt to use in any AI tool.

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Zustand 5** — state with localStorage persistence
- **Framer Motion 12** — transitions and animations
- **IBM Granite Vision 4.1-4b** — image analysis via watsonx.ai
- **IBM Granite 4.1-8b-instruct** — text generation via watsonx.ai

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

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/analyze` | POST | Accepts `{imageBase64, existingDNA}`, returns updated `StyleDNA` |
| `/api/generate` | POST | Accepts `{styleDNA, brief}`, returns project kit |
| `/api/export` | POST | Accepts `{styleDNA, format}`, returns exportable content |

## Granite model IDs

| Model | ID |
|---|---|
| Vision | `ibm/granite-vision-4-1-4b` |
| Text | `ibm/granite-4-1-8b-instruct` |

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout + metadata
│   └── api/
│       ├── analyze/route.ts  # Vision analysis endpoint
│       ├── generate/route.ts # Project kit generation endpoint
│       └── export/route.ts   # DNA export endpoint
├── components/
│   ├── UploadZone.tsx        # Drag-drop image upload
│   ├── StyleDNAPanel.tsx     # DNA visualization
│   ├── ProjectBriefForm.tsx  # New project input
│   └── OutputPanel.tsx       # Generated kit + export
└── lib/
    ├── granite.ts            # watsonx.ai client (IAM token + API calls)
    ├── store.ts              # Zustand state store
    └── style-dna.ts          # Types, prompts, merge logic
```

## License

MIT

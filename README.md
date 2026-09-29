# Slovak B2B Lead Generator & Web Audit

AI-assisted prospecting and website auditing for Slovak small and medium-sized businesses. The app helps sales and marketing teams discover relevant companies, identify digital gaps, verify public business-register information, and prepare localized cold-outreach drafts.

## What the app does

- **Market discovery** — find Slovak SMB prospects by region, industry, employee range, keywords, and result count.
- **Company audit** — run an on-demand audit for a company name or website URL.
- **Digital-gap analysis** — surface actionable website and online-presence signals.
- **Business intelligence links** — provide quick access to ORSR, FinStat, and overit.sk records.
- **AI-generated outreach** — create Slovak or English value propositions, subjects, and cold-email drafts.
- **Lead pipeline** — save prospects, track their status, and maintain notes locally in the browser.
- **Search history** — revisit recent discovery and audit requests.
- **Multi-provider AI support** — use Gemini or configure supported providers such as Anthropic, Perplexity, NVIDIA Nemotron, DeepSeek, OpenAI, and xAI/Grok.
- **Python export** — download a reusable multi-provider integration script from the API.

## Tech stack

- React 19 and TypeScript
- Vite 6
- Express 4 API server
- Tailwind CSS 4 with the Vite plugin
- Google GenAI SDK
- Lucide React icons
- Motion for UI animation
- Node.js and `tsx` for local development
- Vercel-compatible deployment configuration

## Requirements

- Node.js 20 or newer
- npm
- An API key for at least one configured AI provider, unless you are using the application's fallback/demo behavior

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and set the provider key you want to use:

```bash
cp .env.example .env
```

The primary server-side variable is:

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Recommended | Default Google Gemini API key used by the server |
| `APP_URL` | Optional | Public application URL used for hosted integrations and callbacks |

Additional provider keys can be configured as server environment variables when needed: `ANTHROPIC_API_KEY`, `PERPLEXITY_API_KEY`, `NVIDIA_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY`, and `XAI_API_KEY`.

Users can also enter provider-specific keys in the application. These are sent to the server for the selected request and stored in the browser's local storage, so only use this option on trusted devices.

### 3. Start the development server

```bash
npm run dev
```

The app is served at [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite/Express development server with `tsx` |
| `npm run build` | Build the frontend and bundle the Express server into `dist/server.cjs` |
| `npm start` | Run the bundled production server |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm test` | Run the provider-focused test suite |
| `npm run clean` | Remove generated build output |

## API

The Express server exposes the following application endpoints:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/leads/search` | Discover prospects using market filters |
| `POST` | `/api/audit/company` | Audit a company by URL or name |
| `POST` | `/api/leads/refine-pitch` | Refine a prospect's outreach message |
| `POST` | `/api/validate-key` | Validate a provider API key |
| `GET` | `/api/key-status` | Report configured provider availability |
| `GET` | `/api/system-instruction` | Return the active universal system instruction |
| `GET` | `/api/export/python-script` | Download the Python multi-provider example |

Provider selection can be supplied in the request body or through headers such as `x-ai-provider`, `x-ai-model`, and `x-<provider>-api-key`.

## Project structure

```text
.
├── api/index.ts              # Vercel function entry point
├── server.ts                 # Express server and AI provider integrations
├── src/
│   ├── App.tsx               # Main application state and page composition
│   ├── components/            # Search, audit, pipeline, and modal UI
│   ├── data/                  # Slovak regions, industries, and provider metadata
│   ├── utils/api.ts           # Safe JSON requests and client API helpers
│   └── types.ts               # Shared domain and provider types
├── tests/                    # Provider behavior tests
├── public/                   # Static assets
├── vite.config.ts            # Vite and React configuration
└── vercel.json               # Vercel routing and deployment configuration
```

## Data and privacy

The application uses browser local storage for saved leads, search history, selected provider settings, and user-entered provider keys. The API server does not require a database for its core workflow. Do not store production secrets in source control, and never commit `.env` files.

AI-generated company intelligence and outreach drafts should be reviewed before use. Public-register links and third-party provider responses may change or be unavailable, and results should not be treated as legal, financial, or compliance advice.

## Production build

Create the production artifacts with:

```bash
npm run build
npm start
```

The build creates the Vite frontend in `dist/` and bundles the Express server as `dist/server.cjs`. Vercel deployments use the project configuration in `vercel.json` and the serverless entry point in `api/index.ts`.

## Testing and quality checks

Before opening a pull request or deploying, run:

```bash
npm run lint
npm test
npm run build
```

## License

No license has been specified yet. Add the project's intended license before distributing the source publicly.

## Status

This project is under active development. Provider model availability, third-party APIs, and generated intelligence may change over time.

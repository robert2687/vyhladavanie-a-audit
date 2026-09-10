# Slovak B2B Lead Generator & Web Audit Application

Špecializovaná B2B aplikácia pre slovenské malé a stredné podniky (SMB, 3–50 zamestnancov) na generovanie leadov, vykonávanie hĺbkových auditov webov a tvorbu personalizovaných cold outreach pitchov.

## Supported AI Providers
- **Google Gemini** (`GEMINI_API_KEY`)
- **Anthropic Claude** (`ANTHROPIC_API_KEY`)
- **Perplexity Sonar** (`PERPLEXITY_API_KEY`)
- **NVIDIA Nemotron** (`NVIDIA_API_KEY`)
- **DeepSeek** (`DEEPSEEK_API_KEY`)
- **OpenAI GPT** (`OPENAI_API_KEY`)
- **xAI Grok** (`XAI_API_KEY`)

---

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Copy `.env.example` to `.env` and fill in API keys:
   ```bash
   cp .env.example .env
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Run Build & Tests:**
   ```bash
   npm run build
   npm test
   ```

---

## Deployment on Vercel

This repository is optimized for seamless deployment on **Vercel** with Express Serverless Functions and Vite static hosting.

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure your changes are committed and pushed to your repository.

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
2. Select your repository.
3. Vercel will automatically detect the settings from `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Configure Environment Variables in Vercel
Under **Environment Variables**, add any API keys you wish to make available by default:
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `PERPLEXITY_API_KEY`
- `NVIDIA_API_KEY`
- `DEEPSEEK_API_KEY`
- `OPENAI_API_KEY`
- `XAI_API_KEY`

> **Note:** Users can also enter custom API keys directly in the application UI, which will override default server keys.

### Step 4: Deploy
Click **Deploy**. Vercel will build the frontend assets into `dist/` and expose the serverless Express backend via `/api/*` (`api/index.ts`).

---

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS v4 + Motion
- **Backend API**: Express server (`server.ts`), exposed as Vercel Serverless Function (`api/index.ts`)
- **Configuration**: `vercel.json` rewrites `/api/*` to the serverless entrypoint and `/*` to `index.html` for SPA routing.

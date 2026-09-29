# Slovak B2B Lead Generator & Web Audit — PRD / Working Notes

## Original request
"Look for issues in this app" — hunt for performance, bugs/broken flows, security, and UI/UX issues, and fix them right away.

## Architecture (as found)
- Frontend: Vite 6 + React 19 + TypeScript + Tailwind 4 (source in `/app/src`).
- Backend: Express (Node) API defined in `/app/server.ts` (single file, ~1600 lines).
- Multi-provider AI (Gemini/Anthropic/Perplexity/NVIDIA Nemotron/DeepSeek/OpenAI/Grok). With no keys set, the app runs in a **fallback/mock mode** returning a curated Slovak SMB dataset — this is intended default behavior.
- Client persists saved leads, search history, provider keys/models in browser localStorage. No database.
- Deploy target: Vercel (`vercel.json`, `api/index.ts`).

## Platform run model (important)
- The pod supervisor is preconfigured for a Python/React stack (`/app/backend` uvicorn, `/app/frontend` yarn) which did NOT match this Node app, so nothing ran.
- Fix: `/app/frontend/package.json` `start` launches the Node server from `/app` (`npx tsx server.ts`). `server.ts` now binds BOTH port 3000 (frontend) and 8001 (API) to satisfy the ingress contract (`/api/*` → 8001, everything else → 3000). Frontend uses relative `/api` URLs, so no REACT_APP_BACKEND_URL is needed.
- The `backend` supervisor program remains FATAL (expects a non-existent Python app); harmless because the Node server serves the API on 8001.

## Issues found & fixed (2026-09-29)
1. [BLOCKER] App did not run in this environment (stack/supervisor mismatch). Fixed via launcher + dual-port bind in `server.ts`. App now works end-to-end at the preview URL.
2. [BUG/crash] `src/components/RefinePitchModal.tsx` violated the Rules of Hooks — `if (!isOpen || !prospect) return null;` was placed before `useState` calls, crashing React when the modal opened. Moved all hooks above the guard and added a `useEffect` keyed on `prospect?.id` to re-sync subject/body/language when a different prospect is opened.
3. [Security hardening] Added a 1MB JSON body limit (`express.json({ limit: "1mb" })`).

## Verification
- `tsc --noEmit` clean; `npm test` (DeepSeek + Nemotron provider payload tests) pass.
- Frontend E2E via testing agent: 100% — discovery search, refine-pitch modal (open/regenerate/save + state re-sync across prospects), instant audit, save-to-pipeline + status/CSV/MD export, API key modal, search history, guide tab. Zero page errors.

## Backlog / observations (not blocking)
- P2: `server.ts` is a very large single file; could be split into modules (providers, fallback data, routes). Cosmetic/maintainability only.
- P2: Nemotron default model string differs between `src/data/aiProviders.ts` and `App.tsx` defaults; handled by validation, cosmetic.
- P2: Add `data-testid` attributes (alongside existing `id`s) for more robust automation.
- Note: real deployment is Vercel; the pod run model above is for the Emergent preview only.

# Slovak B2B Lead Generator & Web Audit — PRD / Working Notes

## Product
AI-assisted B2B lead discovery + website audit tool for the Slovak SMB market. Vite + React 19 (TypeScript) frontend and an Express (Node) API in a single `server.ts`. UI is in Slovak. Falls back to a curated Slovak SMB dataset when no AI provider key is configured.

## Run model (Emergent pod)
- Single Node process launched by the supervisor `frontend` program via `/app/frontend/package.json` → `cd /app && npx tsx server.ts`.
- Binds BOTH port 3000 (frontend / Vite middleware) and 8001 (API) because the ingress routes `/api/*` → 8001 and everything else → 3000.
- MongoDB: local `mongod` (MONGO_URL in `/app/.env`, DB `slovak_b2b`).
- Real deployment target is Vercel (vercel.json + api/index.ts). For Vercel a cloud MongoDB (Atlas) connection string is required.

## Implemented
- **[2026-06] Issue review round 1:** fixed a React hooks-order crash in `RefinePitchModal`; made the server bind both platform ports; added a 1MB JSON body limit.
- **[2026-06] Accounts:** email/password (JWT httpOnly cookies, bcrypt, brute-force lockout) AND Emergent-managed Google sign-in, unified `users` collection. Admin seeded from env.
- **[2026-06] Cloud Pipeline:** saved leads persist per-user in MongoDB (`leads` collection); loads on any device after login. Endpoints GET/POST/PATCH/DELETE `/api/leads`.
- **[2026-06] CRM Export:** Excel/CSV download (existing), `Kopírovať pre CRM` (HubSpot/Pipedrive tab-separated clipboard), `Kopírovať MD`.
- **[2026-06] Transactional email:** `Poslať mi e-mailom` → POST `/api/leads/email-me` emails the logged-in user their OWN saved leads via Emergent-managed Resend (20s timeout, always JSON).
- **Live AI Search:** works today — user adds a Gemini/Perplexity/etc. key in the in-app provider settings; sent per-request to the server.

## Compliance note (important)
- The prospect **cold-outreach "E-mail" button stays a `mailto:` draft** (opens the user's own mail client). Managed email providers prohibit cold outreach / open relay, so it is NOT routed through the managed provider.

## Auth / test creds
- See `/app/memory/test_credentials.md` and `/app/auth_testing.md`. Admin: admin@slovakb2b.sk / Admin12345.

## Backlog / next
- **Google Sheets push:** deferred — needs the user's Google Cloud OAuth client credentials (client id/secret) with the Sheets scope. Ask for these to implement one-click push into a Sheet in their account.
- Optional: split `server.ts` into route modules; add `data-testid` to header tabs.
- Vercel: provide MongoDB Atlas MONGO_URL + secrets for production.

# Slovak B2B Lead Generator & Web Audit

## Original requirements
- Review and fix performance issues, broken flows, security problems and UI/UX issues.
- Live AI prospect discovery using Gemini or Perplexity keys in provider settings.
- Outreach drafts, account-backed cloud pipeline, Excel-compatible CSV export, Google Sheets push and HubSpot/Pipedrive clipboard export.
- Personal accounts using Emergent-managed Google sign-in AND email/password.
- **Latest user request:** “add also english language”. User chose **Interface and AI results**: menus, audits and generated pitches follow selected language, while the Slovak prospect market stays unchanged.
- User reiterated: “Add the Emergent managed Google sign-in integration to my app.Add the Email & password login integration to my app.” Both integrations already existed; this increment verifies and hardens them rather than duplicating them.
- User communication: English only.

## Architecture / runtime
- **Node.js Express**, not FastAPI. React 19 / Vite / TypeScript frontend in `/app/src`.
- Supervisor `frontend` runs `/app/frontend/package.json` → Node `/app/server.ts`, binding frontend 3000 and API 8001. All API routes have `/api` prefix.
- Existing dev script uses `tsx server.ts` (not watch): Vite updates frontend source; normal backend edits are not automatically re-imported by that process. Do not launch duplicate servers.
- MongoDB uses `MONGO_URL` and `DB_NAME` from `/app/.env`; DB_NAME fallback removed. Never change existing DB configuration.
- Current API/preview base comes from `REACT_APP_BACKEND_URL` in `/app/frontend/.env` (also in root `.env`). Vite exposes only this public config; `safeFetchJson` uses it and includes cookies and `x-ui-language`.
- Users, Google `sessions`, `login_attempts` and private `leads` are Mongo collections. Leads documents contain `{user_id, leadId, lead, saved_at}`. Mongo `_id` is not exposed in public user/lead responses.

## Existing features retained
- Email/password: bcrypt, secure httpOnly JWT access/refresh cookies, sign-up/sign-in/sign-out, login attempt lockout, env-seeded admin.
- Google: dynamic browser-origin redirect to managed authentication, server-side session exchange, seven-day persisted session cookie.
- Cloud pipeline: per-user GET/POST/PATCH/DELETE `/api/leads`, persistent statuses and editable outreach drafts.
- Gemini, Perplexity and five other provider settings + key testing already existed (handoff claim these were missing was inaccurate).
- CSV download usable in Excel already existed; no native `.xlsx` implementation. CRM tab-separated copy and Markdown copy exist.
- Transactional “Email my leads” sends only the account owner their own saved data, with bounded upstream timeout. **Never use managed Resend for cold outreach.** Prospect email action remains `mailto:`.
- Previous fixes: RefinePitchModal hooks-order crash, dual-port routing, JSON payload limit.

## Implemented 2026-09-29
### English / Slovak
- `src/context/LanguageContext.tsx`, `src/components/LanguageSwitch.tsx`, `src/i18n/{index,en,guideEn}.ts` provide explicit locale-based translations.
- Visible language selector on login and app header; preference saved to browser localStorage `slovak_b2b_language`, synced between browser tabs; document `lang` and title update. Existing default is Slovak.
- Translated auth, discovery filters, audit, pipeline controls, provider settings/descriptions, guide/register descriptions, history, modal controls and application errors.
- New search/audit/refine defaults follow UI language; per-operation override remains available. History replay uses current UI language, not an old recorded language.
- Backend `server/localization.ts` adds explicit whole-result language instructions to AI calls, preserving JSON keys, enums, official names, places, IDs and contacts. Existing provider SDKs/models/keys retained.
- English sample templates added for fallback signals, value propositions, metadata and pitches; fallback responses AND individual prospects marked `isMock`. UI clearly says SAMPLE / unverified, not live research. Malformed/incomplete AI output falls back explicitly instead of silently pretending it is live.
- Existing saved/free-text data remains in its original language; changing UI does not translate or mutate saved content. A draft's persisted language changes only when regenerated and saved, not just when selecting a language.
- Browser-stored provider key explanations clarify that keys are transmitted to the backend/provider for requests.

### Authentication hardening
- Fixed React StrictMode Google bootstrap race: one shared promise exchanges the callback first, then exposes the user, without parallel premature `/me` checks.
- Google exchange now rejects missing provider-issued session tokens instead of creating synthetic ones.
- Localized Google error feedback is displayed on login; existing email/password flow retained.
- No existing admin credentials changed. See `memory/test_credentials.md` and `auth_testing.md`.

### Regression fixes discovered in testing
- `src/utils/prospects.ts` normalises partial/legacy lead data at frontend API boundary without rewriting database documents. Fixes full-page pipeline crash when `identifiedWebSignals`/registers/etc. are absent.
- Existing admin lead `lead-email-test` was the reproducer; preserved, not deleted. Incomplete leads now render and can be exported/opened in refine modal.
- Saved status maps to New in pipeline filter/select.
- Responsive header wraps language/provider/auth/navigation controls; pipeline toolbar and quick-audit presets wrap on narrow screens.
- Added unique `data-testid` coverage to controls, alerts and important displayed information.
- Pipeline CRM/Markdown clipboard errors are caught. `CopyFallback.tsx` provides localized notice, selectable text and `.tsv`/`.md` download when browser blocks clipboard access.

## Verification
- TypeScript check and production build passed after localization, auth and incomplete-lead fixes.
- `/app/test_reports/iteration_3.json`: **10/10 backend tests pass**, EN/SK auth/API flows, cloud isolation/persistence, provider messages and export actions verified. Initial responsive sweep incomplete.
- Follow-up found responsive timeout was a real incomplete-lead render crash, not just timing. Fixed and smoke-verified affected pipeline.
- `/app/test_reports/iteration_4.json`: EN/SK discovery/audit/pipeline/guide/provider/refine tested at **320/768/1024/1440**; no page overflow or overlap. Incomplete lead no longer crashes. Clipboard rejection issue reported.
- Clipboard follow-up self-test: denied CRM/Markdown copies show localized fallback; selectable content intact; `.tsv` and `.md` download events pass; successful clipboard branches pass using a controlled clipboard stub; SK/EN error switching passes; **zero page errors**. See `test_reports/iteration_4_followup.md`.
- Google redirect and invalid-session rejection tested; temporary Mongo session path **SIMULATED**. Real Google consent was not completed with a user's Google account.
- Live AI output was not verified with a valid provider key; current no-key flows are **MOCKED sample results**. Prompt language contract is wired; real result-language compliance still needs a live-key check.
- Actual managed email delivery was not retested in this language increment. Existing bounded-error handling remains.

## Next / prioritised backlog
### P0 — User verification
- Complete Google sign-in once with a real Google account to verify consent and return-to-app end to end.
- Add a valid Gemini/Perplexity key in existing provider settings and verify real EN/SK discovery/audit/pitch results (without a key, only explicit samples).
### P1 — Requested remaining work
- Google Sheets push: not implemented. Requires an authorised Google Sheets integration; collect necessary integration credentials/consent when implementing. CSV/CRM exports already work.
### P2 — Future
- Optional native `.xlsx` export; current download is CSV readable by Excel.
- Sync preferred language to user account for cross-device consistency; currently browser-local.
- Modularise large `server.ts` into focused route modules; add schema validation for imported/saved lead payloads.
- Consider translating previously saved drafts on explicit user request, never silently changing them.

## Scope / truthfulness
- English support does not expand discovery beyond the Slovak market.
- Company and place names intentionally retain original spelling. Sample templates are not verified business intelligence.
- No new real AI credentials or third-party services were added during this increment. No authentication integration is mocked in application code; Google-session TESTS used simulation only.
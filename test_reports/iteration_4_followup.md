# Iteration 4 follow-up — 2026-09-29

- Fixed unhandled clipboard promise rejections in `PipelineView`.
- Browser test on current external preview, existing admin, existing partial lead retained.
- Forced clipboard denial (controlled browser stub) for both CRM and Markdown: localized fallback notice appears, no false success state, complete export text available.
- Fallback download events verified: `.tsv` for CRM; `.md` for Markdown.
- Changed EN → SK while fallback visible: notice translated correctly.
- Controlled clipboard success branch verified for both exports; complete company data received; fallback cleared.
- No page errors throughout the test.
- Test log: `/root/.emergent/automation_output/20260929_210923/console_20260929_210923.log`.
- All issues reported in iteration 4 are resolved and verified. Responsive matrix already passed there; not redundantly repeated.
- Real Google consent and live AI generation remain unverified, as documented in PRD.
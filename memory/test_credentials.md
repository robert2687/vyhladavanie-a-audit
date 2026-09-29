# Test Credentials

## Admin (email/password login)
- Email: admin@slovakb2b.sk
- Password: Admin12345
- Role: admin

## Auth
- Email/password: POST /api/auth/register, POST /api/auth/login
- Google (Emergent-managed) social login also enabled (no app password)
- Session check: GET /api/auth/me

## Notes
- Each user has a private cloud pipeline (saved leads scoped by user_id).
- App runs in AI fallback/mock mode unless a provider key is added in the in-app provider settings.

## Iteration 3 test identities (temporary)
- Created and cleaned: `iter3_*@example.com` users for auth/pipeline isolation checks.
- Temporary email/password test accounts used password `Passw0rd123!`; cleaned accounts are no longer available for login. No admin credentials were changed.
- Created and cleaned: simulated Google-session user `iter3_google_*@example.com` with temporary `sessions` row.
- Google consent was not completed with a real Google account. These temporary sessions validate the backend/session path only; no Google password is stored.

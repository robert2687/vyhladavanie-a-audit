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

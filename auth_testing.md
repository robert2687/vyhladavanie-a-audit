# Auth Testing Playbook (Node/Express + MongoDB)

This app uses BOTH:
1. Email/password auth (JWT access cookie `access_token`, 15 min; refresh `refresh_token`, 7 days).
2. Emergent Google login (server exchanges `session_id` for a `session_token`, stored in `sessions` collection, set as httpOnly cookie `session_token`, 7 days).

Users live in one `users` collection keyed by a custom string `user_id` (Mongo `_id` never exposed).
Saved pipeline leads live in `leads`, scoped by `user_id`.

## Endpoints (all under /api)
- POST /api/auth/register {name,email,password} -> sets cookies, returns user
- POST /api/auth/login {email,password} -> sets cookies, returns user
- POST /api/auth/google/session {session_id} -> sets session_token cookie, returns user
- POST /api/auth/logout -> clears cookies / deletes session
- GET  /api/auth/me -> returns current user (cookie or Bearer)
- GET  /api/leads (auth) -> list current user's saved leads
- POST /api/leads (auth) {lead} -> upsert a saved lead
- PATCH /api/leads/:leadId (auth) {status?,notes?,coldOutreach?} -> update
- DELETE /api/leads/:leadId (auth) -> remove one
- DELETE /api/leads (auth) -> clear all for user
- POST /api/leads/email-me (auth) -> emails the logged-in user their pipeline (transactional)

## Step 1 - API testing (email/password)
```
API=http://localhost:8001
curl -c /tmp/c.txt -s -X POST $API/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@slovakb2b.sk","password":"Admin12345"}'
curl -b /tmp/c.txt -s $API/api/auth/me
curl -b /tmp/c.txt -s $API/api/leads
```
Login returns the user object and sets access_token + refresh_token cookies. /me returns the same user.

## Step 2 - Google session (simulated)
Create a session row directly, then set the cookie in the browser:
```
mongosh --quiet --eval '
const d=db.getSiblingDB("slovak_b2b");
const uid="user_"+Math.random().toString(16).slice(2,14);
const tok="test_session_"+Date.now();
d.users.updateOne({email:"gtest@example.com"},{$setOnInsert:{user_id:uid,email:"gtest@example.com",name:"G Test",auth_provider:"google",created_at:new Date()}},{upsert:true});
d.sessions.insertOne({user_id:uid,session_token:tok,expires_at:new Date(Date.now()+7*24*3600*1000),created_at:new Date()});
print(tok);
'
```
Browser: add cookie `session_token=<tok>` (domain = preview host, path=/, httpOnly, secure, sameSite=None), then load the app — it should land on the dashboard, not login.

## Notes
- Frontend detects Google `session_id` from `window.location.hash` on load (synchronously) before the /me check.
- All frontend fetches send `credentials: "include"`.
- Cookies are httpOnly, secure, sameSite=none (preview is https).

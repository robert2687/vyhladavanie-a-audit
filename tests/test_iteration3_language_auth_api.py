"""Iteration 3 backend regression: auth, language localization, Google-session simulation, and leads persistence."""

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

try:
    from pymongo import MongoClient
except Exception:  # pragma: no cover
    MongoClient = None


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
ADMIN_EMAIL = "admin@slovakb2b.sk"
ADMIN_PASSWORD = "Admin12345"


def _require_base_url() -> str:
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


def _json_headers(language: str = "sk", extra: dict | None = None) -> dict:
    headers = {"Content-Type": "application/json", "x-ui-language": language}
    if extra:
        headers.update(extra)
    return headers


def _register(session: requests.Session, email: str, password: str = "Passw0rd123!", name: str = "Test User"):
    base = _require_base_url()
    return session.post(
        f"{base}/api/auth/register",
        json={"name": name, "email": email, "password": password},
        headers=_json_headers("en"),
        timeout=30,
    )


@pytest.fixture
def api_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Auth module coverage: cookie flags, login/logout, error localization, lockout.
class TestAuthLanguage:
    def test_login_sets_http_only_secure_cookies_and_me(self, api_session: requests.Session):
        base = _require_base_url()
        login = api_session.post(
            f"{base}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers=_json_headers("en"),
            timeout=30,
        )
        assert login.status_code == 200
        data = login.json()
        assert data["user"]["email"] == ADMIN_EMAIL

        set_cookie = login.headers.get("set-cookie", "")
        assert "access_token=" in set_cookie
        assert "refresh_token=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "Secure" in set_cookie
        assert "SameSite=None" in set_cookie

        me = api_session.get(f"{base}/api/auth/me", headers={"x-ui-language": "en"}, timeout=30)
        assert me.status_code == 200
        assert me.json()["email"] == ADMIN_EMAIL

    def test_wrong_password_error_localizes_to_english(self, api_session: requests.Session):
        base = _require_base_url()
        email = f"iter3_wrongpw_{uuid.uuid4().hex[:8]}@example.com"
        reg = _register(api_session, email)
        assert reg.status_code in (200, 201)

        wrong = api_session.post(
            f"{base}/api/auth/login",
            json={"email": email, "password": "wrong-password"},
            headers=_json_headers("en"),
            timeout=30,
        )
        assert wrong.status_code == 401
        assert wrong.json().get("error") == "Incorrect email or password."

    def test_register_session_reload_and_logout(self, api_session: requests.Session):
        base = _require_base_url()
        email = f"iter3_reg_{uuid.uuid4().hex[:8]}@example.com"
        reg = _register(api_session, email)
        assert reg.status_code in (200, 201)
        assert reg.json()["user"]["email"] == email

        me1 = api_session.get(f"{base}/api/auth/me", headers={"x-ui-language": "en"}, timeout=30)
        assert me1.status_code == 200
        assert me1.json()["email"] == email

        me2 = api_session.get(f"{base}/api/auth/me", headers={"x-ui-language": "en"}, timeout=30)
        assert me2.status_code == 200
        assert me2.json()["email"] == email

        logout = api_session.post(f"{base}/api/auth/logout", headers={"x-ui-language": "en"}, timeout=30)
        assert logout.status_code == 200
        assert logout.json().get("success") is True

        me3 = api_session.get(f"{base}/api/auth/me", headers={"x-ui-language": "en"}, timeout=30)
        assert me3.status_code == 401

    def test_bruteforce_lockout_after_five_failed_attempts(self, api_session: requests.Session):
        base = _require_base_url()
        email = f"iter3_lock_{uuid.uuid4().hex[:8]}@example.com"
        reg = _register(api_session, email)
        assert reg.status_code in (200, 201)

        statuses = []
        for _ in range(6):
            r = api_session.post(
                f"{base}/api/auth/login",
                json={"email": email, "password": "incorrect"},
                headers=_json_headers("en"),
                timeout=30,
            )
            statuses.append(r.status_code)

        assert statuses[-1] == 429


# Leads + persistence module coverage: auth isolation and coldOutreach language persistence.
class TestLeadsIsolationAndPersistence:
    def test_private_pipeline_isolation_between_users(self):
        base = _require_base_url()
        email_a = f"iter3_a_{uuid.uuid4().hex[:8]}@example.com"
        email_b = f"iter3_b_{uuid.uuid4().hex[:8]}@example.com"
        session_a = requests.Session()
        session_b = requests.Session()

        assert _register(session_a, email_a).status_code in (200, 201)
        assert _register(session_b, email_b).status_code in (200, 201)

        lead_id = f"TEST_ITER3_{uuid.uuid4().hex[:8]}"
        lead = {
            "id": lead_id,
            "companyName": "TEST Pipeline Isolation Co",
            "website": "https://example.com",
            "companySize": "~10-20 employees",
            "industry": "General SMB",
            "region": "Slovakia",
            "targetDecisionMaker": "Owner",
            "directContact": "owner@example.com",
            "identifiedWebSignals": ["Signal"],
            "valueProposition": "Value",
            "coldOutreach": {"subject": "Hello", "body": "Body", "language": "en"},
            "registers": {"orsrUrl": "https://www.orsr.sk", "finstatUrl": "https://finstat.sk", "overitUrl": "https://overit.sk"},
            "auditTimestamp": datetime.now(timezone.utc).isoformat(),
            "status": "new",
        }

        create = session_a.post(f"{base}/api/leads", json={"lead": lead}, headers=_json_headers("en"), timeout=30)
        assert create.status_code == 200
        assert create.json()["lead"]["id"] == lead_id

        leads_a = session_a.get(f"{base}/api/leads", headers={"x-ui-language": "en"}, timeout=30)
        assert leads_a.status_code == 200
        assert any(x.get("id") == lead_id for x in leads_a.json()["leads"])

        leads_b = session_b.get(f"{base}/api/leads", headers={"x-ui-language": "en"}, timeout=30)
        assert leads_b.status_code == 200
        assert all(x.get("id") != lead_id for x in leads_b.json()["leads"])

    def test_saved_cold_outreach_language_persists_on_patch(self, api_session: requests.Session):
        base = _require_base_url()
        login = api_session.post(
            f"{base}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            headers=_json_headers("en"),
            timeout=30,
        )
        assert login.status_code == 200

        lead_id = f"TEST_ITER3_LANG_{uuid.uuid4().hex[:8]}"
        lead = {
            "id": lead_id,
            "companyName": "TEST Language Persist Co",
            "website": "https://example.org",
            "companySize": "~11-18 employees",
            "industry": "General SMB",
            "region": "Slovakia",
            "targetDecisionMaker": "Owner",
            "directContact": "owner@example.org",
            "identifiedWebSignals": ["Signal"],
            "valueProposition": "Value",
            "coldOutreach": {"subject": "Initial", "body": "Initial body", "language": "en"},
            "registers": {"orsrUrl": "https://www.orsr.sk", "finstatUrl": "https://finstat.sk", "overitUrl": "https://overit.sk"},
            "auditTimestamp": datetime.now(timezone.utc).isoformat(),
            "status": "saved",
        }
        created = api_session.post(f"{base}/api/leads", json={"lead": lead}, headers=_json_headers("en"), timeout=30)
        assert created.status_code == 200
        assert created.json()["lead"]["coldOutreach"]["language"] == "en"

        patched = api_session.patch(
            f"{base}/api/leads/{lead_id}",
            json={"coldOutreach": {"subject": "SK subjekt", "body": "SK text", "language": "sk"}},
            headers=_json_headers("en"),
            timeout=30,
        )
        assert patched.status_code == 200
        assert patched.json()["lead"]["coldOutreach"]["language"] == "sk"

        fetched = api_session.get(f"{base}/api/leads", headers={"x-ui-language": "en"}, timeout=30)
        assert fetched.status_code == 200
        target = [x for x in fetched.json()["leads"] if x.get("id") == lead_id][0]
        assert target["coldOutreach"]["language"] == "sk"


# AI fallback localization module coverage: EN/SK output + explicit mock labels.
class TestLocalizedMockResponses:
    def test_search_mock_contains_isMock_and_language_specific_content(self, api_session: requests.Session):
        base = _require_base_url()
        payload = {
            "provider": "perplexity",
            "model": "sonar",
            "region": "Bratislavský kraj",
            "industry": "Stavebníctvo",
            "minEmployees": 3,
            "maxEmployees": 50,
            "count": 1,
        }

        en = api_session.post(
            f"{base}/api/leads/search",
            json={**payload, "language": "en"},
            headers=_json_headers("en", {"x-ai-provider": "perplexity", "x-ai-model": "sonar"}),
            timeout=40,
        )
        assert en.status_code == 200
        en_data = en.json()
        assert en_data["success"] is True
        assert en_data.get("isMock") is True
        assert isinstance(en_data.get("prospects"), list) and len(en_data["prospects"]) > 0
        en_p = en_data["prospects"][0]
        assert en_p.get("isMock") is True
        assert en_p["coldOutreach"]["language"] == "en"
        assert "employees" in en_p.get("companySize", "")

        sk = api_session.post(
            f"{base}/api/leads/search",
            json={**payload, "language": "sk"},
            headers=_json_headers("sk", {"x-ai-provider": "perplexity", "x-ai-model": "sonar"}),
            timeout=40,
        )
        assert sk.status_code == 200
        sk_data = sk.json()
        assert sk_data.get("isMock") is True
        sk_p = sk_data["prospects"][0]
        assert sk_p.get("isMock") is True
        assert sk_p["coldOutreach"]["language"] == "sk"
        assert "zamestnancov" in sk_p.get("companySize", "")

    def test_audit_and_refine_support_en_and_sk_with_mock_flags(self, api_session: requests.Session):
        base = _require_base_url()

        audit_en = api_session.post(
            f"{base}/api/audit/company",
            json={"urlOrName": "in-vest.sk", "industry": "Stavebníctvo", "language": "en", "provider": "perplexity"},
            headers=_json_headers("en", {"x-ai-provider": "perplexity", "x-ai-model": "sonar"}),
            timeout=40,
        )
        assert audit_en.status_code == 200
        ad_en = audit_en.json()
        assert ad_en["success"] is True
        assert ad_en.get("isMock") is True
        assert ad_en["prospect"]["isMock"] is True
        assert ad_en["prospect"]["coldOutreach"]["language"] == "en"

        refine_sk = api_session.post(
            f"{base}/api/leads/refine-pitch",
            json={
                "companyName": "TEST Co",
                "decisionMaker": "Owner",
                "webSignals": ["signal"],
                "valueProposition": "value",
                "tone": "direct",
                "language": "sk",
                "provider": "perplexity",
            },
            headers=_json_headers("sk", {"x-ai-provider": "perplexity", "x-ai-model": "sonar"}),
            timeout=40,
        )
        assert refine_sk.status_code == 200
        rd_sk = refine_sk.json()
        assert rd_sk["success"] is True
        assert rd_sk.get("isMock") is True
        assert isinstance(rd_sk.get("subject"), str) and len(rd_sk["subject"]) > 0
        assert isinstance(rd_sk.get("body"), str) and len(rd_sk["body"]) > 0


# Google session module coverage: missing/invalid rejection + simulated DB session acceptance.
class TestGoogleSessionFlow:
    def test_google_session_missing_or_invalid_rejected(self, api_session: requests.Session):
        base = _require_base_url()

        missing = api_session.post(
            f"{base}/api/auth/google/session",
            json={},
            headers=_json_headers("en"),
            timeout=30,
        )
        assert missing.status_code == 400

        invalid = api_session.post(
            f"{base}/api/auth/google/session",
            json={"session_id": f"invalid_{uuid.uuid4().hex}"},
            headers=_json_headers("en"),
            timeout=30,
        )
        assert invalid.status_code in (401, 500)

    @pytest.mark.skipif(MongoClient is None, reason="pymongo not installed")
    def test_simulated_google_session_cookie_auth_via_mongo(self):
        base = _require_base_url()
        mongo_url = os.environ.get("MONGO_URL")
        db_name = os.environ.get("DB_NAME")
        if not mongo_url or not db_name:
            pytest.skip("MONGO_URL/DB_NAME are not set")

        client = MongoClient(mongo_url)
        db = client[db_name]

        email = f"iter3_google_{uuid.uuid4().hex[:8]}@example.com"
        user_id = f"user_iter3_{uuid.uuid4().hex[:12]}"
        token = f"session_iter3_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=3)

        db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": "Iter3 Google Sim",
            "role": "user",
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc),
        })
        db.sessions.insert_one({
            "user_id": user_id,
            "session_token": token,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc),
        })

        try:
            s = requests.Session()
            s.cookies.set("session_token", token)
            me = s.get(f"{base}/api/auth/me", headers={"x-ui-language": "en"}, timeout=30)
            assert me.status_code == 200
            data = me.json()
            assert data["email"] == email
            assert data["user_id"] == user_id
        finally:
            db.sessions.delete_many({"session_token": token})
            db.users.delete_many({"user_id": user_id})
            client.close()

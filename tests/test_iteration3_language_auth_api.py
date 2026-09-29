"""Iteration 3 backend regression: auth, language localization, Google-session simulation, and leads persistence."""

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests

try:
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except Exception:  # pragma: no cover
    MongoClient = None
    PYMONGO_AVAILABLE = False


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
ADMIN_EMAIL = os.environ.get("TEST_ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("TEST_ADMIN_PASSWORD")


def _require_base_url() -> str:
    if not BASE_URL:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE_URL.rstrip("/")


def _require_admin_credentials() -> tuple[str, str]:
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        pytest.skip("TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD are not set")
    return ADMIN_EMAIL, ADMIN_PASSWORD


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


def _login_admin(session: requests.Session):
    base = _require_base_url()
    email, password = _require_admin_credentials()
    return session.post(
        f"{base}/api/auth/login",
        json={"email": email, "password": password},
        headers=_json_headers("en"),
        timeout=30,
    )


def _sample_lead(lead_id: str, *, status: str = "new", contact: str = "owner@example.com", language: str = "en") -> dict:
    return {
        "id": lead_id,
        "companyName": "TEST Pipeline Co",
        "website": "https://example.com",
        "companySize": "~10-20 employees",
        "industry": "General SMB",
        "region": "Slovakia",
        "targetDecisionMaker": "Owner",
        "directContact": contact,
        "identifiedWebSignals": ["Signal"],
        "valueProposition": "Value",
        "coldOutreach": {"subject": "Hello", "body": "Body", "language": language},
        "registers": {"orsrUrl": "https://www.orsr.sk", "finstatUrl": "https://finstat.sk", "overitUrl": "https://overit.sk"},
        "auditTimestamp": datetime.now(timezone.utc).isoformat(),
        "status": status,
    }


def _assert_localized_prospect(prospect: dict, language: str, size_marker: str) -> None:
    assert prospect.get("isMock")
    assert prospect["coldOutreach"]["language"] == language
    assert size_marker in prospect.get("companySize", "")


def _lead_ids(response: requests.Response) -> set:
    return {x.get("id") for x in response.json()["leads"]}


def _assert_nonempty_str(value) -> None:
    assert isinstance(value, str)
    assert len(value) > 0


@pytest.fixture
def api_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# Auth module coverage: cookie flags, login/logout, error localization, lockout.
class TestAuthLanguage:
    def test_login_sets_http_only_secure_cookies_and_me(self, api_session: requests.Session):
        base = _require_base_url()
        email, _ = _require_admin_credentials()
        login = _login_admin(api_session)
        assert login.status_code == 200
        data = login.json()
        assert data["user"]["email"] == email

        set_cookie = login.headers.get("set-cookie", "")
        assert "access_token=" in set_cookie
        assert "refresh_token=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "Secure" in set_cookie
        assert "SameSite=None" in set_cookie

        me = api_session.get(f"{base}/api/auth/me", headers={"x-ui-language": "en"}, timeout=30)
        assert me.status_code == 200
        assert me.json()["email"] == email

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
        assert logout.json().get("success")

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
        session_a = requests.Session()
        session_b = requests.Session()

        assert _register(session_a, f"iter3_a_{uuid.uuid4().hex[:8]}@example.com").status_code in (200, 201)
        assert _register(session_b, f"iter3_b_{uuid.uuid4().hex[:8]}@example.com").status_code in (200, 201)

        lead_id = f"TEST_ITER3_{uuid.uuid4().hex[:8]}"
        create = session_a.post(f"{base}/api/leads", json={"lead": _sample_lead(lead_id)}, headers=_json_headers("en"), timeout=30)
        assert create.status_code == 200
        assert create.json()["lead"]["id"] == lead_id

        leads_a = session_a.get(f"{base}/api/leads", headers={"x-ui-language": "en"}, timeout=30)
        assert leads_a.status_code == 200
        assert lead_id in _lead_ids(leads_a)

        leads_b = session_b.get(f"{base}/api/leads", headers={"x-ui-language": "en"}, timeout=30)
        assert leads_b.status_code == 200
        assert lead_id not in _lead_ids(leads_b)

    def test_saved_cold_outreach_language_persists_on_patch(self, api_session: requests.Session):
        base = _require_base_url()
        assert _login_admin(api_session).status_code == 200

        lead_id = f"TEST_ITER3_LANG_{uuid.uuid4().hex[:8]}"
        created = api_session.post(
            f"{base}/api/leads",
            json={"lead": _sample_lead(lead_id, status="saved", contact="owner@example.org", language="en")},
            headers=_json_headers("en"),
            timeout=30,
        )
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
    def _search(self, session: requests.Session, language: str):
        base = _require_base_url()
        payload = {
            "provider": "perplexity",
            "model": "sonar",
            "region": "Bratislavský kraj",
            "industry": "Stavebníctvo",
            "minEmployees": 3,
            "maxEmployees": 50,
            "count": 1,
            "language": language,
        }
        return session.post(
            f"{base}/api/leads/search",
            json=payload,
            headers=_json_headers(language, {"x-ai-provider": "perplexity", "x-ai-model": "sonar"}),
            timeout=40,
        )

    def test_search_mock_contains_isMock_and_language_specific_content(self, api_session: requests.Session):
        en = self._search(api_session, "en")
        assert en.status_code == 200
        en_data = en.json()
        assert en_data["success"]
        assert en_data.get("isMock")
        assert isinstance(en_data.get("prospects"), list) and len(en_data["prospects"]) > 0
        _assert_localized_prospect(en_data["prospects"][0], "en", "employees")

        sk = self._search(api_session, "sk")
        assert sk.status_code == 200
        sk_data = sk.json()
        assert sk_data.get("isMock")
        _assert_localized_prospect(sk_data["prospects"][0], "sk", "zamestnancov")

    def _audit_company(self, session: requests.Session):
        base = _require_base_url()
        return session.post(
            f"{base}/api/audit/company",
            json={"urlOrName": "in-vest.sk", "industry": "Stavebníctvo", "language": "en", "provider": "perplexity"},
            headers=_json_headers("en", {"x-ai-provider": "perplexity", "x-ai-model": "sonar"}),
            timeout=40,
        )

    def _refine_pitch(self, session: requests.Session):
        base = _require_base_url()
        return session.post(
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

    def test_audit_and_refine_support_en_and_sk_with_mock_flags(self, api_session: requests.Session):
        audit_en = self._audit_company(api_session)
        assert audit_en.status_code == 200
        ad_en = audit_en.json()
        assert ad_en["success"]
        assert ad_en.get("isMock")
        assert ad_en["prospect"]["isMock"]
        assert ad_en["prospect"]["coldOutreach"]["language"] == "en"

        refine_sk = self._refine_pitch(api_session)
        assert refine_sk.status_code == 200
        rd_sk = refine_sk.json()
        assert rd_sk["success"]
        assert rd_sk.get("isMock")
        _assert_nonempty_str(rd_sk.get("subject"))
        _assert_nonempty_str(rd_sk.get("body"))


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

    @pytest.mark.skipif(not PYMONGO_AVAILABLE, reason="pymongo not installed")
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

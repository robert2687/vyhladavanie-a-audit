"""Backend tests: auth + pipeline for Slovak B2B Lead Generator."""
import os
import uuid

import pytest
import requests

BASE = (os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
ADMIN = {
    "email": os.environ.get("TEST_ADMIN_EMAIL"),
    "password": os.environ.get("TEST_ADMIN_PASSWORD"),
}


def _require_base() -> str:
    if not BASE:
        pytest.skip("REACT_APP_BACKEND_URL is not set")
    return BASE


def _require_admin() -> dict:
    if not ADMIN["email"] or not ADMIN["password"]:
        pytest.skip("TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD are not set")
    return ADMIN


@pytest.fixture
def s():
    return requests.Session()


@pytest.fixture
def admin_session(s):
    base = _require_base()
    r = s.post(f"{base}/api/auth/login", json=_require_admin())
    assert r.status_code == 200, r.text
    return s


def _leads(session):
    base = _require_base()
    r = session.get(f"{base}/api/leads")
    assert r.status_code == 200
    data = r.json()
    return data["leads"] if isinstance(data, dict) else data


def _create_lead(session):
    base = _require_base()
    lead = {
        "id": f"TEST_{uuid.uuid4().hex[:8]}",
        "companyName": "TEST Company",
        "sector": "IT",
        "status": "new",
    }
    r = session.post(f"{base}/api/leads", json={"lead": lead})
    assert r.status_code in (200, 201), r.text
    return lead


class TestAuth:
    def test_me_unauth(self, s):
        base = _require_base()
        r = s.get(f"{base}/api/auth/me")
        assert r.status_code == 401

    def test_register_and_me(self, s):
        base = _require_base()
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{base}/api/auth/register", json={"name": "T", "email": email, "password": "Passw0rd!"})
        assert r.status_code in (200, 201), r.text
        me = s.get(f"{base}/api/auth/me")
        assert me.status_code == 200
        assert me.json().get("email") == email

    def test_login_wrong_password(self, s):
        base = _require_base()
        admin = _require_admin()
        r = s.post(f"{base}/api/auth/login", json={"email": admin["email"], "password": "wrongpass"})
        assert r.status_code in (400, 401), r.status_code

    def test_admin_login(self, s):
        base = _require_base()
        admin = _require_admin()
        r = s.post(f"{base}/api/auth/login", json=admin)
        assert r.status_code == 200
        me = s.get(f"{base}/api/auth/me")
        assert me.status_code == 200
        assert me.json().get("email") == admin["email"]

    def test_logout(self, admin_session):
        base = _require_base()
        r = admin_session.post(f"{base}/api/auth/logout")
        assert r.status_code in (200, 204)
        me = admin_session.get(f"{base}/api/auth/me")
        assert me.status_code == 401


class TestPipeline:
    def test_create_and_read_lead(self, admin_session):
        lead = _create_lead(admin_session)
        leads = _leads(admin_session)
        assert isinstance(leads, list)
        assert any(l.get("id") == lead["id"] for l in leads), f"lead not persisted: {leads}"

    def test_update_lead(self, admin_session):
        base = _require_base()
        lead = _create_lead(admin_session)
        r = admin_session.patch(f"{base}/api/leads/{lead['id']}", json={"status": "contacted"})
        assert r.status_code in (200, 204), r.text
        found = [l for l in _leads(admin_session) if l.get("id") == lead["id"]]
        assert found and found[0].get("status") == "contacted"

    def test_delete_lead(self, admin_session):
        base = _require_base()
        lead = _create_lead(admin_session)
        r = admin_session.delete(f"{base}/api/leads/{lead['id']}")
        assert r.status_code in (200, 204)
        assert not any(l.get("id") == lead["id"] for l in _leads(admin_session))

    def test_leads_requires_auth(self):
        base = _require_base()
        r = requests.get(f"{base}/api/leads")
        assert r.status_code == 401

    def test_email_me_endpoint(self, admin_session):
        base = _require_base()
        r = admin_session.post(f"{base}/api/leads/email-me", json={})
        assert r.status_code in (200, 400, 422, 500, 502), r.status_code
        try:
            r.json()
        except Exception:
            pytest.fail(f"Non-JSON response: {r.text[:200]}")

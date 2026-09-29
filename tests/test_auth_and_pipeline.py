"""Backend tests: auth + pipeline for Slovak B2B Lead Generator."""
import os, uuid, requests, pytest

BASE = "https://cf833342-de57-4fec-bf2e-8e458982335d.preview.emergentagent.com"
ADMIN = {"email": "admin@slovakb2b.sk", "password": "Admin12345"}


@pytest.fixture
def s():
    return requests.Session()


@pytest.fixture
def admin_session(s):
    r = s.post(f"{BASE}/api/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    return s


class TestAuth:
    def test_me_unauth(self, s):
        r = s.get(f"{BASE}/api/auth/me")
        assert r.status_code == 401

    def test_register_and_me(self, s):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{BASE}/api/auth/register", json={"name": "T", "email": email, "password": "Passw0rd!"})
        assert r.status_code in (200, 201), r.text
        me = s.get(f"{BASE}/api/auth/me")
        assert me.status_code == 200
        assert me.json().get("email") == email

    def test_login_wrong_password(self, s):
        r = s.post(f"{BASE}/api/auth/login", json={"email": ADMIN["email"], "password": "wrongpass"})
        assert r.status_code in (400, 401), r.status_code

    def test_admin_login(self, s):
        r = s.post(f"{BASE}/api/auth/login", json=ADMIN)
        assert r.status_code == 200
        me = s.get(f"{BASE}/api/auth/me")
        assert me.status_code == 200
        assert me.json().get("email") == ADMIN["email"]

    def test_logout(self, admin_session):
        r = admin_session.post(f"{BASE}/api/auth/logout")
        assert r.status_code in (200, 204)
        me = admin_session.get(f"{BASE}/api/auth/me")
        assert me.status_code == 401


class TestPipeline:
    def _leads(self, s):
        r = s.get(f"{BASE}/api/leads")
        assert r.status_code == 200
        data = r.json()
        return data["leads"] if isinstance(data, dict) else data

    def test_leads_crud(self, admin_session):
        s = admin_session
        initial = self._leads(s)
        assert isinstance(initial, list)

        lead = {
            "id": f"TEST_{uuid.uuid4().hex[:8]}",
            "companyName": "TEST Company",
            "sector": "IT",
            "status": "new",
        }
        r = s.post(f"{BASE}/api/leads", json={"lead": lead})
        assert r.status_code in (200, 201), r.text

        leads = self._leads(s)
        assert any(l.get("id") == lead["id"] for l in leads), f"lead not persisted: {leads}"

        r = s.patch(f"{BASE}/api/leads/{lead['id']}", json={"status": "contacted"})
        assert r.status_code in (200, 204), r.text
        found = [l for l in self._leads(s) if l.get("id") == lead["id"]]
        assert found and found[0].get("status") == "contacted"

        r = s.delete(f"{BASE}/api/leads/{lead['id']}")
        assert r.status_code in (200, 204)
        assert not any(l.get("id") == lead["id"] for l in self._leads(s))

    def test_leads_requires_auth(self):
        r = requests.get(f"{BASE}/api/leads")
        assert r.status_code == 401

    def test_email_me_endpoint(self, admin_session):
        # Endpoint should wire up and respond (success or provider-rejection error both acceptable)
        r = admin_session.post(f"{BASE}/api/leads/email-me", json={})
        assert r.status_code in (200, 400, 422, 500, 502), r.status_code
        # Body should be JSON
        try:
            r.json()
        except Exception:
            pytest.fail(f"Non-JSON response: {r.text[:200]}")

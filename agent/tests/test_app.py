import os

os.environ.setdefault("SUPABASE_URL", "http://example.test")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "service-key")
os.environ.setdefault("AGENT_API_KEY", "test-agent-key")

from app import app  # noqa: E402


def test_health():
    response = app.test_client().get("/health")
    assert response.status_code == 200
    assert response.json["status"] == "ok"


def test_rejects_missing_agent_key():
    response = app.test_client().post("/api/signals", json={})
    assert response.status_code == 401


def test_validates_signal_payload():
    response = app.test_client().post("/api/signals", headers={"X-Agent-Key": "test-agent-key"}, json={})
    assert response.status_code == 400
    assert "errors" in response.json

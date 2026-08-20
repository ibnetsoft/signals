from __future__ import annotations

import hmac
import os
from datetime import datetime, timezone
from typing import Any

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)

ALLOWED_ACTIONS = {"buy", "sell", "hold", "close"}
REQUIRED_FIELDS = {"symbol", "timeframe", "action", "entry_price", "strategy", "occurred_at"}


def settings() -> tuple[str, str, str]:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    api_key = os.getenv("AGENT_API_KEY", "")
    if not url or not service_key or not api_key:
        raise RuntimeError("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AGENT_API_KEY가 필요합니다.")
    return url, service_key, api_key


def authorized(expected: str) -> bool:
    supplied = request.headers.get("X-Agent-Key", "")
    return bool(supplied) and hmac.compare_digest(supplied, expected)


def supabase_headers(service_key: str) -> dict[str, str]:
    return {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def validate_signal(payload: Any) -> list[str]:
    if not isinstance(payload, dict):
        return ["JSON 객체가 필요합니다."]
    errors = [f"{field} 필드가 필요합니다." for field in REQUIRED_FIELDS if payload.get(field) in (None, "")]
    if payload.get("action") not in ALLOWED_ACTIONS:
        errors.append("action은 buy, sell, hold, close 중 하나여야 합니다.")
    try:
        if float(payload.get("entry_price", 0)) <= 0:
            errors.append("entry_price는 0보다 커야 합니다.")
    except (TypeError, ValueError):
        errors.append("entry_price는 숫자여야 합니다.")
    return errors


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "signals-agent"})


@app.post("/api/signals")
def receive_signal():
    try:
        supabase_url, service_key, api_key = settings()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    if not authorized(api_key):
        return jsonify({"error": "unauthorized"}), 401

    payload = request.get_json(silent=True)
    errors = validate_signal(payload)
    if errors:
        return jsonify({"errors": errors}), 400

    signal = {
        "source": payload.get("source", "metatrader"),
        "symbol": str(payload["symbol"]).upper(),
        "market": payload.get("market", "forex"),
        "timeframe": str(payload["timeframe"]).upper(),
        "action": payload["action"],
        "entry_price": payload["entry_price"],
        "stop_loss": payload.get("stop_loss"),
        "take_profit": payload.get("take_profit"),
        "confidence": payload.get("confidence"),
        "strategy": payload["strategy"],
        "occurred_at": payload["occurred_at"],
        "metadata": payload.get("metadata", {}),
    }
    response = requests.post(
        f"{supabase_url}/rest/v1/signals",
        headers=supabase_headers(service_key),
        json=signal,
        timeout=10,
    )
    if response.status_code == 409:
        return jsonify({"error": "duplicate signal"}), 409
    if not response.ok:
        app.logger.error("Supabase signal insert failed: %s %s", response.status_code, response.text)
        return jsonify({"error": "signal storage unavailable"}), 502
    return jsonify(response.json()[0]), 201


@app.post("/api/heartbeat")
def heartbeat():
    try:
        supabase_url, service_key, api_key = settings()
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    if not authorized(api_key):
        return jsonify({"error": "unauthorized"}), 401
    payload = request.get_json(silent=True) or {}
    agent_id = os.getenv("AGENT_ID", "metatrader-local-01")
    row = {
        "agent_id": agent_id,
        "source": payload.get("source", "metatrader"),
        "version": payload.get("version"),
        "terminal_account": payload.get("terminal_account"),
        "last_seen_at": datetime.now(timezone.utc).isoformat(),
        "details": payload.get("details", {}),
    }
    headers = supabase_headers(service_key) | {"Prefer": "resolution=merge-duplicates,return=representation"}
    response = requests.post(f"{supabase_url}/rest/v1/agent_status?on_conflict=agent_id", headers=headers, json=row, timeout=10)
    if not response.ok:
        app.logger.error("Supabase heartbeat upsert failed: %s %s", response.status_code, response.text)
        return jsonify({"error": "heartbeat storage unavailable"}), 502
    return jsonify(response.json()[0])


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5050")), debug=False)

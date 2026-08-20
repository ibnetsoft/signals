import os
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

response = requests.post(
    "http://127.0.0.1:5050/api/signals",
    headers={"X-Agent-Key": os.environ["AGENT_API_KEY"]},
    json={
        "symbol": "EURUSD",
        "market": "forex",
        "timeframe": "M15",
        "action": "buy",
        "entry_price": 1.1652,
        "stop_loss": 1.161,
        "take_profit": 1.1735,
        "confidence": 82,
        "strategy": "metatrader-test",
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    },
    timeout=10,
)
print(response.status_code, response.text)

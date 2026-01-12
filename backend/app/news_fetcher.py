"""Utility script to fetch and cache AI news using the FastAPI service helpers."""
from __future__ import annotations

import asyncio
from datetime import datetime, timezone

from .main import ensure_db, fetch_news_from_api, upsert_news


async def run() -> None:
    ensure_db()
    items = await fetch_news_from_api()
    fetched_at = datetime.now(timezone.utc)
    upsert_news(items, fetched_at)
    print(f"Fetched {len(items)} news items at {fetched_at.isoformat()}")


if __name__ == "__main__":
    asyncio.run(run())

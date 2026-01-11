import os
import sqlite3
from datetime import datetime, timezone
from typing import List, Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DB_PATH = os.getenv("NEWS_DB_PATH", os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "db", "news.db")))
NEWS_API_KEY = os.getenv("NEWSAPI_KEY")
NEWS_API_URL = "https://newsapi.org/v2/everything"
KEYWORDS = ["AI", "人工知能", "生成AI", "ChatGPT", "Claude", "Gemini", "Anthropic", "OpenAI", "Stability AI"]
MAX_SUMMARY_LENGTH = 200


class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    published_at: datetime
    source: str
    url: str


class NewsResponse(BaseModel):
    items: List[NewsItem]
    fetched_at: datetime


app = FastAPI(title="AI News Curator")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def ensure_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS news (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                summary TEXT NOT NULL,
                published_at TEXT NOT NULL,
                source TEXT NOT NULL,
                url TEXT NOT NULL,
                fetched_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def truncate_summary(text: Optional[str]) -> str:
    if not text:
        return ""
    summary = text.strip()
    if len(summary) <= MAX_SUMMARY_LENGTH:
        return summary
    return summary[: MAX_SUMMARY_LENGTH - 1].rstrip() + "…"


def upsert_news(items: List[NewsItem], fetched_at: datetime) -> None:
    with sqlite3.connect(DB_PATH) as conn:
        for item in items:
            conn.execute(
                """
                INSERT INTO news (id, title, summary, published_at, source, url, fetched_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    title=excluded.title,
                    summary=excluded.summary,
                    published_at=excluded.published_at,
                    source=excluded.source,
                    url=excluded.url,
                    fetched_at=excluded.fetched_at
                """,
                (
                    item.id,
                    item.title,
                    item.summary,
                    item.published_at.isoformat(),
                    item.source,
                    item.url,
                    fetched_at.isoformat(),
                ),
            )
        conn.commit()


def fetch_cached_news(limit: int = 50) -> List[NewsItem]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            "SELECT * FROM news ORDER BY published_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [
        NewsItem(
            id=row["id"],
            title=row["title"],
            summary=row["summary"],
            published_at=datetime.fromisoformat(row["published_at"]),
            source=row["source"],
            url=row["url"],
        )
        for row in rows
    ]


async def fetch_news_from_api() -> List[NewsItem]:
    if not NEWS_API_KEY:
        raise RuntimeError("NEWSAPI_KEY environment variable is not set")

    query = " OR ".join(KEYWORDS)
    params = {
        "q": query,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 50,
    }
    headers = {"Authorization": NEWS_API_KEY}

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(NEWS_API_URL, params=params, headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch news from NewsAPI")

    payload = response.json()
    articles = payload.get("articles", [])
    seen_urls = set()
    items: List[NewsItem] = []
    for article in articles:
        url = article.get("url")
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        title = article.get("title") or "Untitled"
        description = article.get("description") or article.get("content") or ""
        published_at_str = article.get("publishedAt")
        try:
            published_at = datetime.fromisoformat(published_at_str.replace("Z", "+00:00")) if published_at_str else datetime.now(timezone.utc)
        except ValueError:
            published_at = datetime.now(timezone.utc)
        source = article.get("source", {}).get("name") or "Unknown"
        summary = truncate_summary(description)
        item = NewsItem(
            id=url,
            title=title,
            summary=summary,
            published_at=published_at,
            source=source,
            url=url,
        )
        items.append(item)

    return items


@app.on_event("startup")
async def on_startup() -> None:
    ensure_db()
    try:
        items = await fetch_news_from_api()
        fetched_at = datetime.now(timezone.utc)
        upsert_news(items, fetched_at)
    except Exception as exc:  # pragma: no cover - log in real app
        print(f"Startup news fetch failed: {exc}")


@app.get("/api/news", response_model=NewsResponse)
async def get_news() -> NewsResponse:
    try:
        items = await fetch_news_from_api()
        fetched_at = datetime.now(timezone.utc)
        upsert_news(items, fetched_at)
        return NewsResponse(items=items, fetched_at=fetched_at)
    except RuntimeError as runtime_error:
        if fetch_cached := fetch_cached_news():
            fetched_at = datetime.now(timezone.utc)
            return NewsResponse(items=fetch_cached, fetched_at=fetched_at)
        raise HTTPException(status_code=500, detail=str(runtime_error))
    except HTTPException:
        if cached := fetch_cached_news():
            fetched_at = datetime.now(timezone.utc)
            return NewsResponse(items=cached, fetched_at=fetched_at)
        raise


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}

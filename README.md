# AI News Reader MVP

AI関連ニュースを自動取得し、ブラウザ音声で読み上げるMVPアプリケーションです。FastAPIバックエンドとReact + Tailwind CSSフロントエンドで構成されています。

## プロジェクト構成

```
/backend        FastAPI アプリケーション
/frontend       React + Tailwind フロントエンド
/db/news.db     ニュースキャッシュ用 SQLite データベース（初回実行時に生成）
```

## 前提条件

- Python 3.11 以上
- Node.js 18 以上
- NewsAPI APIキー（[https://newsapi.org/](https://newsapi.org/) で取得）

## セットアップ手順

### 1. バックエンド

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows の場合は .venv\\Scripts\\activate
pip install -r requirements.txt
export NEWSAPI_KEY="<取得したAPIキー>"
uvicorn app.main:app --reload
```

> `NEWSAPI_KEY` が未設定の場合は最新データ取得が失敗し、キャッシュが存在すればキャッシュを返します。

### 2. フロントエンド

別ターミナルで以下を実行します。

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスします。開発サーバーは `/api` へのリクエストを `http://localhost:8000` のバックエンドへプロキシします。

## ニュースの定期取得

バックエンド起動時に最新ニュースを1回取得し、`/api/news` エンドポイントを呼び出すたびにNewsAPIから再取得してキャッシュへ保存します。別途定期取得したい場合は以下のスクリプトをスケジューラ（cronなど）に登録してください。

```bash
cd backend
source .venv/bin/activate
export NEWSAPI_KEY="<取得したAPIキー>"
python -m app.news_fetcher
```

## フロントエンドの主な機能

- AI関連ニュース一覧（カード表示）
- 日付フィルタ
- ニュースの読み上げ（ブラウザ SpeechSynthesis API）
- 再生リスト機能（キュー追加、連続再生）
- 音声選択、再生速度変更

## 注意事項

- NewsAPIの無料プランでは商用利用や特定ソースの利用に制限があります。必ず利用規約を確認してください。
- ブラウザの音声合成機能は環境によって利用可能な声の種類が異なります。
# EconBrief (MVP)

経済ニュースを収集して分析・音声化し、1日1回のまとめをメールで送るための最小構成MVPです。

## 技術スタック
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env` を編集して必要な値を設定します。

### DB migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

## ローカル起動

```bash
npm run dev
```

`http://localhost:3000` にアクセスします。

## 環境変数

| 変数 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `OPENAI_API_KEY` | OpenAI API キー |
| `OPENAI_MODEL` | LLM モデル名 |
| `OPENAI_TTS_VOICE` | TTS ボイス名 |
| `S3_ENDPOINT` | S3 互換ストレージのエンドポイント |
| `S3_REGION` | S3 リージョン |
| `S3_BUCKET` | バケット名 |
| `S3_ACCESS_KEY_ID` | アクセスキー |
| `S3_SECRET_ACCESS_KEY` | シークレット |
| `PUBLIC_BASE_URL` | 公開URL (例: `http://localhost:3000`) |
| `SENDGRID_API_KEY` | SendGrid API キー |
| `MAIL_TO` | 送信先メール |
| `MAIL_FROM` | 送信元メール |

## 画面

- `/` 記事一覧 (検索・タグフィルタ)
- `/articles/[id]` 記事詳細 (分析/台本/音声の生成ボタン)
- `/logs` メール送信ログ

## 運用方法 (Cron/API 呼び出し)

### RSS ソースの登録

```sql
insert into "Source" ("id", "name", "rssUrl", "enabled", "createdAt")
values ('source-1', '日経', 'https://www.nikkei.com/rss/newsrelease.rdf', true, now());
```

※ `id` は任意のユニークな文字列でOKです。

### RSS 取り込み

```bash
curl -X POST http://localhost:3000/api/ingest/rss
```

### 記事分析

```bash
curl -X POST http://localhost:3000/api/articles/{articleId}/analyze
```

### 音声台本生成

```bash
curl -X POST http://localhost:3000/api/articles/{articleId}/script
```

### 音声生成

```bash
curl -X POST http://localhost:3000/api/scripts/{scriptId}/audio
```

### デイリーダイジェスト

```bash
curl -X POST http://localhost:3000/api/digest/daily
```

## 開発メモ

- RSS取り込み/LLM分析/TTS/メール送信はAPIキーと外部サービス設定が必須です。
- まだRSS取り込みやLLM/TTS/メール送信は未実装です。次のステップで実装します。
- 記事本文は保存しません。保存対象はURL、タイトル、媒体名、公開日時、抜粋、タグ、生成物のみです。

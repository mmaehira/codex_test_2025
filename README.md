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
| `STORAGE_MODE` | `s3` または `local` (未設定時は `s3`) |
| `LOCAL_STORAGE_DIR` | ローカル保存先ディレクトリ (例: `public/uploads`) |
| `LOCAL_STORAGE_PUBLIC_PATH` | ローカル公開パス (例: `/uploads`) |
| `S3_ENDPOINT` | S3 互換ストレージのエンドポイント |
| `S3_PUBLIC_ENDPOINT` | 公開配信用のエンドポイント (例: R2 の `https://<bucket>.<account>.r2.dev`) |
| `S3_REGION` | S3 リージョン |
| `S3_BUCKET` | バケット名 |
| `S3_ACCESS_KEY_ID` | アクセスキー |
| `S3_SECRET_ACCESS_KEY` | シークレット |
| `PUBLIC_BASE_URL` | 公開URL (例: `http://localhost:3000`) |
| `SENDGRID_API_KEY` | SendGrid API キー |
| `MAIL_TO` | 送信先メール |
| `MAIL_FROM` | 送信元メール |

### ローカルに音声を保存する場合

S3 を用意せずに試す場合は、以下の環境変数を設定してください。

```env
STORAGE_MODE=local
LOCAL_STORAGE_DIR=public/uploads
LOCAL_STORAGE_PUBLIC_PATH=/uploads
```

`PUBLIC_BASE_URL` が設定されている場合は、生成された音声URLが `PUBLIC_BASE_URL` を基準に作られます。

### Cloudflare R2 で公開再生する場合

R2 の API エンドポイント (`S3_ENDPOINT`) と公開配信用エンドポイントを分けて設定してください。

```env
STORAGE_MODE=s3
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_PUBLIC_ENDPOINT=https://<bucket>.<account-id>.r2.dev
```

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

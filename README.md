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

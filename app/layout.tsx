import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "EconBrief",
  description: "Economic news digest MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <header className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">EconBrief</h1>
              <p className="text-sm text-slate-400">
                経済ニュースを集約して分析・音声化するMVP
              </p>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="/">記事一覧</a>
              <a href="/logs">送信ログ</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

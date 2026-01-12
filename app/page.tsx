import Link from "next/link";
import { prisma } from "../lib/prisma";

interface HomeProps {
  searchParams?: {
    q?: string;
    tag?: string;
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const query = searchParams?.q?.trim() ?? "";
  const tag = searchParams?.tag?.trim() ?? "";

  const articles = await prisma.article.findMany({
    where: {
      title: query ? { contains: query, mode: "insensitive" } : undefined,
      tags: tag ? { has: tag } : undefined
    },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      source: true,
      analyses: { take: 1, orderBy: { createdAt: "desc" } }
    }
  });

  const tags = await prisma.article.findMany({
    select: { tags: true }
  });

  const uniqueTags = Array.from(
    new Set(tags.flatMap((entry) => entry.tags))
  ).slice(0, 20);

  return (
    <main className="space-y-6">
      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold">記事一覧</h2>
        <form className="mt-3 flex flex-wrap gap-3 text-sm" method="get">
          <input
            type="text"
            name="q"
            placeholder="タイトル検索"
            defaultValue={query}
            className="w-60 rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          />
          <select
            name="tag"
            defaultValue={tag}
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
          >
            <option value="">タグフィルタ</option>
            {uniqueTags.map((tagValue) => (
              <option key={tagValue} value={tagValue}>
                {tagValue}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-sky-500 px-4 py-2 text-white"
          >
            検索
          </button>
        </form>
      </section>

      <section className="grid gap-4">
        {articles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-slate-400">
            記事がまだありません。RSS取り込みジョブを実行してください。
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id}
              className="rounded-lg border border-slate-800 bg-slate-900/30 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/articles/${article.id}`}
                    className="text-lg font-semibold"
                  >
                    {article.title}
                  </Link>
                  <p className="text-xs text-slate-400">
                    {article.source.name} ・{" "}
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleString()
                      : "日時不明"}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {article.excerpt ?? "抜粋は未登録です。"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    article.analyses.length > 0
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {article.analyses.length > 0 ? "分析済み" : "未分析"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {article.tags.map((tagValue) => (
                  <Link
                    key={tagValue}
                    href={`/?tag=${encodeURIComponent(tagValue)}`}
                    className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                  >
                    #{tagValue}
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

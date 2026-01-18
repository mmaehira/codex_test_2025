import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { ActionButtons } from "../../components/action-buttons";

interface ArticlePageProps {
  params: { id: string };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      source: true,
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
      scripts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { audioFiles: { orderBy: { createdAt: "desc" }, take: 1 } }
      }
    }
  });

  if (!article) {
    notFound();
  }

  const analysis = article.analyses[0];
  const script = article.scripts[0];
  const audio = script?.audioFiles[0];

  return (
    <main className="space-y-6">
      <Link href="/" className="text-sm">
        ← 記事一覧へ戻る
      </Link>

      <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h2 className="text-xl font-semibold">{article.title}</h2>
        <p className="text-xs text-slate-400">
          {article.source.name} ・{" "}
          {article.publishedAt
            ? new Date(article.publishedAt).toLocaleString()
            : "日時不明"}
        </p>
        <p className="mt-3 text-sm text-slate-300">
          {article.excerpt ?? "抜粋は未登録です。"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {article.tags.map((tagValue) => (
            <span
              key={tagValue}
              className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
            >
              #{tagValue}
            </span>
          ))}
        </div>
        <ActionButtons articleId={article.id} scriptId={script?.id ?? null} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-lg font-semibold">分析結果 (JSON)</h3>
          <pre className="mt-3 max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-200">
            {analysis
              ? JSON.stringify(analysis.contentJson, null, 2)
              : "分析結果がありません。"}
          </pre>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <h3 className="text-lg font-semibold">音声台本</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
            {script?.text ?? "台本がありません。"}
          </p>
          <div className="mt-4">
            <h4 className="text-sm font-semibold">音声</h4>
            {audio ? (
              <audio controls className="mt-2 w-full">
                <source src={audio.publicUrl} type="audio/mpeg" />
                お使いのブラウザはaudioタグに対応していません。
              </audio>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                音声がまだ生成されていません。
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

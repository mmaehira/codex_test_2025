import { prisma } from "../../lib/prisma";

export default async function LogsPage() {
  const logs = await prisma.mailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <main className="space-y-6">
      <h2 className="text-xl font-semibold">メール送信ログ</h2>
      <div className="grid gap-3">
        {logs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-6 text-slate-400">
            送信ログはまだありません。
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-slate-800 bg-slate-900/30 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{log.subject}</p>
                  <p className="text-xs text-slate-400">
                    宛先: {log.toEmail} ・{" "}
                    {log.sentAt
                      ? new Date(log.sentAt).toLocaleString()
                      : "未送信"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    log.status === "SUCCESS"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {log.status}
                </span>
              </div>
              {log.errorMessage ? (
                <p className="mt-2 text-xs text-rose-300">
                  {log.errorMessage}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

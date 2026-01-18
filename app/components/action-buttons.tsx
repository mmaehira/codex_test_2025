"use client";

import { useState, useTransition } from "react";

interface ActionButtonsProps {
  articleId: string;
  scriptId: string | null;
}

export function ActionButtons({ articleId, scriptId }: ActionButtonsProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const trigger = async (url: string) => {
    setMessage(null);
    const response = await fetch(url, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "処理に失敗しました。");
      return;
    }
    setMessage(payload.message ?? "実行しました。再読み込みしてください。");
  };

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            startTransition(() => trigger(`/api/articles/${articleId}/analyze`))
          }
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm text-white"
          disabled={isPending}
        >
          分析生成
        </button>
        <button
          type="button"
          onClick={() =>
            startTransition(() => trigger(`/api/articles/${articleId}/script`))
          }
          className="rounded-md bg-sky-500 px-4 py-2 text-sm text-white"
          disabled={isPending}
        >
          音声台本生成
        </button>
        <button
          type="button"
          onClick={() => {
            if (!scriptId) {
              setMessage("先に台本を生成してください。");
              return;
            }
            startTransition(() => trigger(`/api/scripts/${scriptId}/audio`));
          }}
          className="rounded-md bg-violet-500 px-4 py-2 text-sm text-white"
          disabled={isPending}
        >
          音声生成
        </button>
      </div>
      {message ? (
        <p className="text-sm text-slate-300">{message}</p>
      ) : null}
    </div>
  );
}

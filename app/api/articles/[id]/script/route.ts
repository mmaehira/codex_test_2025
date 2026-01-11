import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getEnv } from "../../../../lib/env";
import { createChatCompletion, withRetry } from "../../../../lib/openai";
import { prisma } from "../../../../lib/prisma";
import { logServiceError } from "../../../../lib/service-error-log";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const requestId = randomUUID();
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: {
        source: true,
        analyses: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!article) {
      return NextResponse.json(
        { error: "記事が見つかりません。", requestId, articleId: params.id },
        { status: 404 }
      );
    }

    const analysis = article.analyses[0];
    if (!analysis) {
      return NextResponse.json(
        {
          error: "先に分析を生成してください。",
          requestId,
          articleId: article.id,
          sourceId: article.sourceId
        },
        { status: 400 }
      );
    }

    const model = getEnv("OPENAI_MODEL", "gpt-4.1-mini") ?? "gpt-4.1-mini";
    const prompt = [
      "以下の分析JSONをもとに、3〜7分程度の音声台本を日本語で作成してください。",
      "話し言葉で、構成は「結論→背景→市場→次に見るべきもの」。",
      "断定を避け、条件分岐（もし〜なら）を1つ以上入れてください。",
      "",
      `記事タイトル: ${article.title}`,
      `媒体: ${article.source.name}`,
      `分析JSON: ${JSON.stringify(analysis.contentJson)}`
    ].join("\n");

    let scriptText: string;
    try {
      scriptText = await withRetry(() =>
        createChatCompletion({
          model,
          temperature: 0.4,
          messages: [
            {
              role: "system",
              content:
                "You are a professional script writer for finance podcasts."
            },
            { role: "user", content: prompt }
          ]
        })
      );
    } catch (error) {
      await logServiceError({
        service: "OPENAI",
        context: "ARTICLE_SCRIPT",
        error,
        requestId,
        articleId: article.id,
        sourceId: article.sourceId
      });
      throw error;
    }

    const script = await prisma.script.create({
      data: {
        articleId: article.id,
        kind: "ARTICLE",
        text: scriptText.trim()
      }
    });

    return NextResponse.json({
      message: "台本を生成しました。",
      requestId,
      scriptId: script.id,
      articleId: article.id,
      sourceId: article.sourceId
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "台本生成でエラーが発生しました。", requestId },
      { status: 500 }
    );
  }
}

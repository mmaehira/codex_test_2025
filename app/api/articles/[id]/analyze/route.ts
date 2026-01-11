import { NextResponse } from "next/server";
import { analysisSchema } from "../../../../../lib/analysis-schema";
import { getEnv } from "../../../../../lib/env";
import { createChatCompletion, withRetry } from "../../../../../lib/openai";
import { prisma } from "../../../../../lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id },
      include: { source: true }
    });

    if (!article) {
      return NextResponse.json(
        { error: "記事が見つかりません。" },
        { status: 404 }
      );
    }

    const model = getEnv("OPENAI_MODEL", "gpt-4.1-mini") ?? "gpt-4.1-mini";
    const prompt = [
      "以下の記事メタ情報から経済分析を作成してください。",
      "必ず指定のJSONスキーマに従い、JSONのみ返してください。",
      "本文は保存していないため、与えられた抜粋のみを使って推測すること。",
      "不確実性や条件分岐を含め、断定を避ける。",
      "",
      `タイトル: ${article.title}`,
      `媒体: ${article.source.name}`,
      `公開日時: ${article.publishedAt?.toISOString() ?? "不明"}`,
      `抜粋: ${article.excerpt ?? "なし"}`,
      `タグ: ${article.tags.join(", ") || "なし"}`
    ].join("\n");

    const content = await withRetry(() =>
      createChatCompletion({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a financial analyst. Output strictly valid JSON."
          },
          { role: "user", content: prompt }
        ]
      })
    );

    const parsed = analysisSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "分析JSONの形式が不正です。" },
        { status: 422 }
      );
    }

    const analysis = await prisma.analysis.create({
      data: {
        articleId: article.id,
        model,
        contentJson: parsed.data
      }
    });

    return NextResponse.json({
      message: "分析を生成しました。",
      analysisId: analysis.id
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "分析生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}

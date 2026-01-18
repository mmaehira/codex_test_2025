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
    const schemaExample = {
      summary: "短い要約",
      background: ["背景1", "背景2"],
      timeline_positioning: ["時系列の位置づけ1"],
      geopolitical_impact: ["地政学的影響1"],
      market_impact: {
        equities: ["株式への影響1"],
        rates: ["金利への影響1"],
        fx: ["為替への影響1"],
        commodities: ["コモディティへの影響1"],
        credit: ["クレジットへの影響1"]
      },
      uncertainties: ["不確実性1"],
      what_to_watch_next: ["次に注目すべき点1"]
    };

    const prompt = [
      "以下の記事メタ情報から経済分析を作成してください。",
      "必ず指定のJSONスキーマに従い、JSONのみ返してください。",
      "配列の項目は必ず配列で返し、空にせず最低1件は含めてください。",
      "出力は次のJSON構造と同じキーを必ず含めてください。",
      JSON.stringify(schemaExample, null, 2),
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

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse analysis JSON", parseError, content);
      return NextResponse.json(
        { error: "分析JSONの形式が不正です。" },
        { status: 422 }
      );
    }

    const parsed = analysisSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.error("Invalid analysis JSON shape", parsed.error.format());
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

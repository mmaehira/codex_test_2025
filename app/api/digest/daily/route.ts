import { NextResponse } from "next/server";
import { getEnv } from "../../../lib/env";
import { sendMail } from "../../../lib/mail";
import { createChatCompletion, createSpeech, withRetry } from "../../../lib/openai";
import { prisma } from "../../../lib/prisma";
import { uploadAudio } from "../../../lib/storage";

export const runtime = "nodejs";

export async function POST() {
  const toEmail = getEnv("MAIL_TO");
  if (!toEmail) {
    return NextResponse.json(
      { error: "MAIL_TO が設定されていません。" },
      { status: 400 }
    );
  }

  try {
    const analyses = await prisma.analysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        article: { include: { source: true } }
      }
    });

    if (analyses.length === 0) {
      return NextResponse.json(
        { error: "分析済みの記事がありません。" },
        { status: 400 }
      );
    }

    const model = getEnv("OPENAI_MODEL", "gpt-4.1-mini") ?? "gpt-4.1-mini";
    const prompt = [
      "以下の複数記事の分析JSONから、今日のまとめ台本を作成してください。",
      "構成は「結論→背景→市場→次に見るべきもの」。",
      "3〜7分を想定し、話し言葉で、断定を避け条件分岐を1つ以上含める。",
      "",
      ...analyses.map(
        (analysis, index) =>
          `${index + 1}. ${analysis.article.title} (${analysis.article.source.name})\n` +
          JSON.stringify(analysis.contentJson)
      )
    ].join("\n");

    const scriptText = await withRetry(() =>
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

    const script = await prisma.script.create({
      data: {
        kind: "DAILY_DIGEST",
        text: scriptText.trim()
      }
    });

    const voice = getEnv("OPENAI_TTS_VOICE", "alloy") ?? "alloy";
    const audioBuffer = await withRetry(() =>
      createSpeech({
        model: "gpt-4o-mini-tts",
        voice,
        input: script.text
      })
    );

    const storageKey = `audio/daily-${script.id}-${Date.now()}.mp3`;
    const stored = await uploadAudio(storageKey, audioBuffer);

    await prisma.audioFile.create({
      data: {
        scriptId: script.id,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl
      }
    });

    const subject = "EconBrief 今日のまとめ";
    const body = [
      "本日の経済ニュースまとめです。",
      "",
      `音声はこちら: ${stored.publicUrl}`,
      "",
      "----",
      script.text.slice(0, 1000)
    ].join("\n");

    await sendMail({ toEmail, subject, text: body });

    const log = await prisma.mailLog.create({
      data: {
        kind: "DAILY_DIGEST",
        toEmail,
        subject,
        status: "SUCCESS",
        sentAt: new Date()
      }
    });

    return NextResponse.json({
      message: "デイリーダイジェストを送信しました。",
      logId: log.id
    });
  } catch (error) {
    console.error(error);
    const toEmailValue = toEmail ?? "unknown";
    const subject = "EconBrief 今日のまとめ";
    const errorMessage =
      error instanceof Error ? error.message : "不明なエラー";

    await prisma.mailLog.create({
      data: {
        kind: "DAILY_DIGEST",
        toEmail: toEmailValue,
        subject,
        status: "FAILURE",
        errorMessage
      }
    });

    return NextResponse.json(
      { error: "デイリーダイジェスト送信でエラーが発生しました。" },
      { status: 500 }
    );
  }

export async function POST() {
  return NextResponse.json({
    message: "デイリーダイジェスト生成は未実装です。次のステップで実装します。"
  });
}

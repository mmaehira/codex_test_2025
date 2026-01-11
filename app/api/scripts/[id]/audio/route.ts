import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getEnv } from "../../../../lib/env";
import { createSpeech, withRetry } from "../../../../lib/openai";
import { prisma } from "../../../../lib/prisma";
import { logServiceError } from "../../../../lib/service-error-log";
import { uploadAudio } from "../../../../lib/storage";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const requestId = randomUUID();
  try {
    const script = await prisma.script.findUnique({
      where: { id: params.id },
      include: {
        article: { include: { source: true } }
      }
    });

    if (!script) {
      return NextResponse.json(
        { error: "台本が見つかりません。", requestId, scriptId: params.id },
        { status: 404 }
      );
    }

    const voice = getEnv("OPENAI_TTS_VOICE", "alloy") ?? "alloy";
    let audioBuffer: Buffer;
    try {
      audioBuffer = await withRetry(() =>
        createSpeech({
          model: "gpt-4o-mini-tts",
          voice,
          input: script.text
        })
      );
    } catch (error) {
      await logServiceError({
        service: "OPENAI",
        context: "SCRIPT_AUDIO",
        error,
        requestId,
        scriptId: script.id,
        articleId: script.articleId,
        sourceId: script.article?.sourceId
      });
      throw error;
    }

    const storageKey = `audio/${script.id}-${Date.now()}.mp3`;
    let stored;
    try {
      stored = await uploadAudio(storageKey, audioBuffer);
    } catch (error) {
      await logServiceError({
        service: "S3",
        context: "SCRIPT_AUDIO",
        error,
        requestId,
        scriptId: script.id,
        articleId: script.articleId,
        sourceId: script.article?.sourceId
      });
      throw error;
    }

    const audioFile = await prisma.audioFile.create({
      data: {
        scriptId: script.id,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl
      }
    });

    return NextResponse.json({
      message: "音声を生成しました。",
      requestId,
      audioFileId: audioFile.id,
      publicUrl: stored.publicUrl,
      scriptId: script.id,
      articleId: script.articleId ?? undefined,
      sourceId: script.article?.sourceId ?? undefined
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "音声生成でエラーが発生しました。", requestId },
      { status: 500 }
    );
  }
}

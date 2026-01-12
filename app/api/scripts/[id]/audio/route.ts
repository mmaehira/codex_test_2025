import { NextResponse } from "next/server";
import { getEnv } from "../../../../../lib/env";
import { createSpeech, withRetry } from "../../../../../lib/openai";
import { prisma } from "../../../../../lib/prisma";
import { uploadAudio } from "../../../../../lib/storage";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const script = await prisma.script.findUnique({
      where: { id: params.id }
    });

    if (!script) {
      return NextResponse.json(
        { error: "台本が見つかりません。" },
        { status: 404 }
      );
    }

    const voice = getEnv("OPENAI_TTS_VOICE", "alloy") ?? "alloy";
    const audioBuffer = await withRetry(() =>
      createSpeech({
        model: "gpt-4o-mini-tts",
        voice,
        input: script.text
      })
    );

    const storageKey = `audio/${script.id}-${Date.now()}.mp3`;
    const stored = await uploadAudio(storageKey, audioBuffer);

    const audioFile = await prisma.audioFile.create({
      data: {
        scriptId: script.id,
        storageKey: stored.storageKey,
        publicUrl: stored.publicUrl
      }
    });

    return NextResponse.json({
      message: "音声を生成しました。",
      audioFileId: audioFile.id,
      publicUrl: stored.publicUrl
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "音声生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}

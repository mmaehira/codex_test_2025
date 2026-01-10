import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

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

    return NextResponse.json({
      message: "音声生成は未実装です。次のステップで実装します。"
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "音声生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}

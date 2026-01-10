import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const article = await prisma.article.findUnique({
      where: { id: params.id }
    });

    if (!article) {
      return NextResponse.json(
        { error: "記事が見つかりません。" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "分析生成は未実装です。次のステップで実装します。"
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "分析生成でエラーが発生しました。" },
      { status: 500 }
    );
  }
}

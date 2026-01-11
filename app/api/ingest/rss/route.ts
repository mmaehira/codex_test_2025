import Parser from "rss-parser";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { normalizeUrl, truncateText } from "../../../lib/normalize";

export async function POST() {
  try {
    const sources = await prisma.source.findMany({
      where: { enabled: true }
    });

    if (sources.length === 0) {
      return NextResponse.json({
        message: "有効なRSSソースがありません。"
      });
    }

    const parser = new Parser();
    let createdCount = 0;
    let skippedCount = 0;

    for (const source of sources) {
      try {
        const feed = await parser.parseURL(source.rssUrl);
        for (const item of feed.items ?? []) {
          const url = item.link ?? item.guid;
          if (!url || !item.title) {
            skippedCount += 1;
            continue;
          }

          const normalized = normalizeUrl(url);
          const existing = await prisma.article.findFirst({
            where: { urlNormalized: normalized }
          });

          if (existing) {
            skippedCount += 1;
            continue;
          }

          const publishedAt = item.isoDate
            ? new Date(item.isoDate)
            : item.pubDate
            ? new Date(item.pubDate)
            : null;

          await prisma.article.create({
            data: {
              sourceId: source.id,
              url,
              urlNormalized: normalized,
              title: item.title,
              publishedAt,
              fetchedAt: new Date(),
              excerpt: truncateText(item.contentSnippet ?? item.content, 400),
              tags: (item.categories ?? []).slice(0, 10)
            }
          });
          createdCount += 1;
        }
      } catch (error) {
        console.error(`RSS取得失敗: ${source.rssUrl}`, error);
      }
    }

    return NextResponse.json({
      message: "RSS取り込みが完了しました。",
      createdCount,
      skippedCount
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "RSS取り込みでエラーが発生しました。" },
      { status: 500 }
    );
  }
}

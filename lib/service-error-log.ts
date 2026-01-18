import { prisma } from "./prisma";

export type ServiceErrorContext =
  | "ANALYSIS"
  | "ARTICLE_SCRIPT"
  | "SCRIPT_AUDIO"
  | "DAILY_DIGEST_SCRIPT"
  | "DAILY_DIGEST_AUDIO"
  | "DAILY_DIGEST_EMAIL"
  | "RSS_INGEST";

interface ServiceErrorPayload {
  service: "OPENAI" | "SENDGRID" | "S3";
  context: ServiceErrorContext;
  error: unknown;
  requestId?: string;
  articleId?: string | null;
  scriptId?: string | null;
  sourceId?: string | null;
}

export async function logServiceError({
  service,
  context,
  error,
  requestId,
  articleId,
  scriptId,
  sourceId
}: ServiceErrorPayload): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  try {
    await prisma.serviceErrorLog.create({
      data: {
        service,
        context,
        errorMessage,
        requestId,
        articleId: articleId ?? undefined,
        scriptId: scriptId ?? undefined,
        sourceId: sourceId ?? undefined
      }
    });
  } catch (logError) {
    console.error("Failed to write ServiceErrorLog", logError);
  }
}

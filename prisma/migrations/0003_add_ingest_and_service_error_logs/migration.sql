CREATE TYPE "IngestStatus" AS ENUM ('SUCCESS', 'FAILURE');

CREATE TYPE "ExternalService" AS ENUM ('OPENAI', 'SENDGRID', 'S3');

CREATE TABLE "IngestLog" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "rssUrl" TEXT NOT NULL,
    "status" "IngestStatus" NOT NULL,
    "errorMessage" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ServiceErrorLog" (
    "id" TEXT NOT NULL,
    "service" "ExternalService" NOT NULL,
    "context" TEXT NOT NULL,
    "requestId" TEXT,
    "articleId" TEXT,
    "scriptId" TEXT,
    "sourceId" TEXT,
    "errorMessage" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IngestLog_sourceId_idx" ON "IngestLog"("sourceId");
CREATE INDEX "ServiceErrorLog_articleId_idx" ON "ServiceErrorLog"("articleId");
CREATE INDEX "ServiceErrorLog_scriptId_idx" ON "ServiceErrorLog"("scriptId");
CREATE INDEX "ServiceErrorLog_sourceId_idx" ON "ServiceErrorLog"("sourceId");

ALTER TABLE "IngestLog" ADD CONSTRAINT "IngestLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceErrorLog" ADD CONSTRAINT "ServiceErrorLog_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceErrorLog" ADD CONSTRAINT "ServiceErrorLog_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ServiceErrorLog" ADD CONSTRAINT "ServiceErrorLog_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

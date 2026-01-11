-- Add unique constraint for normalized URL to prevent duplicates
CREATE UNIQUE INDEX "Article_urlNormalized_key" ON "Article"("urlNormalized");

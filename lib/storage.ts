import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEnv, requireEnv } from "./env";

export interface StoredFile {
  storageKey: string;
  publicUrl: string;
}

function createS3Client() {
  return new S3Client({
    region: requireEnv("S3_REGION"),
    endpoint: requireEnv("S3_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("S3_SECRET_ACCESS_KEY")
    },
    forcePathStyle: true
  });
}

function normalizeStorageKey(storageKey: string) {
  return storageKey.replace(/^\/+/, "");
}

async function uploadAudioToLocal(
  storageKey: string,
  audioBuffer: Buffer
): Promise<StoredFile> {
  const localDir = getEnv("LOCAL_STORAGE_DIR", "public/uploads") ?? "public/uploads";
  const publicPath =
    getEnv("LOCAL_STORAGE_PUBLIC_PATH", "/uploads") ?? "/uploads";
  const baseUrl = (getEnv("PUBLIC_BASE_URL") ?? "").replace(/\/$/, "");
  const safeKey = normalizeStorageKey(storageKey);
  const targetPath = path.resolve(process.cwd(), localDir, safeKey);

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, audioBuffer);

  const normalizedPublicPath = `/${publicPath.replace(/^\/?/, "").replace(/\/$/, "")}`;
  const publicUrl = baseUrl
    ? `${baseUrl}${normalizedPublicPath}/${safeKey}`
    : `${normalizedPublicPath}/${safeKey}`;

  return {
    storageKey: safeKey,
    publicUrl
  };
}

export async function uploadAudio(
  storageKey: string,
  audioBuffer: Buffer
): Promise<StoredFile> {
  const mode = getEnv("STORAGE_MODE", "s3");
  if (mode === "local") {
    return uploadAudioToLocal(storageKey, audioBuffer);
  }

  const bucket = requireEnv("S3_BUCKET");
  const endpoint = requireEnv("S3_ENDPOINT").replace(/\/$/, "");
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: normalizeStorageKey(storageKey),
      Body: audioBuffer,
      ContentType: "audio/mpeg"
    })
  );

  return {
    storageKey: normalizeStorageKey(storageKey),
    publicUrl: `${endpoint}/${bucket}/${normalizeStorageKey(storageKey)}`
  };
}

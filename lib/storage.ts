import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireEnv } from "./env";

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

export async function uploadAudio(
  storageKey: string,
  audioBuffer: Buffer
): Promise<StoredFile> {
  const bucket = requireEnv("S3_BUCKET");
  const endpoint = requireEnv("S3_ENDPOINT").replace(/\/$/, "");
  const client = createS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: audioBuffer,
      ContentType: "audio/mpeg"
    })
  );

  return {
    storageKey,
    publicUrl: `${endpoint}/${bucket}/${storageKey}`
  };
}

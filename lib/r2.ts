/* ═══════════════════════════════════════
   QHIETHUS — Cloudflare R2 Client
   Compatible with AWS S3 SDK v3
═══════════════════════════════════════ */
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/** R2 S3-compatible client */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!

/**
 * Generate a signed URL valid for `expiresIn` seconds (default 1 hour).
 * The PDF URL is NEVER exposed to the client directly.
 */
export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
  return getSignedUrl(r2, command, { expiresIn })
}

/** Upload a file buffer to R2 */
export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return key
}

/** Generate a presigned PUT URL so the browser can upload directly to R2 */
export async function getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType })
  return getSignedUrl(r2, command, { expiresIn })
}

/** Delete a file from R2 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }))
}

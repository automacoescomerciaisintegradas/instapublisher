import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { VectorEntry } from "./types";

let r2ClientInstance: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("Missing Cloudflare R2 configuration. Please check CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
    }

    // Validation for common "swapped keys" error
    if (accessKeyId.length === 64 && secretAccessKey.length === 32) {
      throw new Error("Cloudflare R2 keys appear to be swapped. The Access Key ID should be 32 characters and the Secret Access Key should be 64 characters.");
    }

    if (accessKeyId.length !== 32) {
      throw new Error(`Invalid Cloudflare R2 Access Key ID length (${accessKeyId.length}). It should be 32 characters.`);
    }

    r2ClientInstance = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2ClientInstance;
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME;

export async function uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  await client.send(command);
  
  // Return the public URL if configured, otherwise a placeholder
  // Usually R2 public URLs follow a pattern or use a custom domain
  const publicUrl = process.env.R2_PUBLIC_URL 
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `https://${BUCKET_NAME}.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
    
  return publicUrl;
}

export async function saveVector(entry: VectorEntry) {
  const client = getR2Client();
  const key = `vectors/${entry.metadata.type}/${entry.metadata.id}.json`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: JSON.stringify(entry),
    ContentType: "application/json",
  });

  await client.send(command);
}

export async function listVectors(): Promise<VectorEntry[]> {
  const client = getR2Client();
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: "vectors/",
  });

  const response = await client.send(command);
  const vectors: VectorEntry[] = [];

  if (response.Contents) {
    for (const item of response.Contents) {
      if (item.Key?.endsWith(".json")) {
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: item.Key,
        });
        const getResponse = await client.send(getCommand);
        const body = await getResponse.Body?.transformToString();
        if (body) {
          vectors.push(JSON.parse(body));
        }
      }
    }
  }

  return vectors;
}

export async function deleteVector(type: string, id: string) {
  const client = getR2Client();
  const key = `vectors/${type}/${id}.json`;
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

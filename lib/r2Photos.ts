// Cloudflare R2 photo storage. Credentials and public base URL come from Vercel env vars.
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function client() {
  return new S3Client({
    region: "auto",
    endpoint: required("R2_ENDPOINT"),
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID"),
      secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
    },
  });
}

function bucket() {
  return required("R2_BUCKET");
}

function publicBaseUrl() {
  return required("R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
}

export async function uploadR2Photo(args: {
  key: string;
  body: ArrayBuffer | Uint8Array;
  contentType: string;
}) {
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: args.key,
      Body: Buffer.from(args.body),
      ContentType: args.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicBaseUrl()}/${args.key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export async function deleteR2PhotoByUrl(url: string) {
  const base = publicBaseUrl();
  if (!url.startsWith(base + "/")) return false;

  const key = decodeURIComponent(url.slice(base.length + 1));
  if (!key) return false;

  await client().send(
    new DeleteObjectCommand({
      Bucket: bucket(),
      Key: key,
    })
  );

  return true;
}

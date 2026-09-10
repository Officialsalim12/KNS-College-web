// Cloudflare R2 client (S3-compatible). This is the ONLY module that touches
// R2 credentials — nothing in server.js talks to the AWS SDK directly, and
// nothing here is ever require()'d or referenced by frontend/ code.

const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2_ACCOUNT_ID = (process.env.R2_ACCOUNT_ID || '').trim();
const R2_ACCESS_KEY_ID = (process.env.R2_ACCESS_KEY_ID || '').trim();
const R2_SECRET_ACCESS_KEY = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
const R2_ENDPOINT = (process.env.R2_ENDPOINT || '').trim() ||
    (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
const R2_BUCKET_PUBLIC = (process.env.R2_BUCKET_PUBLIC || '').trim();
const R2_BUCKET_PRIVATE = (process.env.R2_BUCKET_PRIVATE || '').trim();
const R2_PUBLIC_BASE_URL = (process.env.R2_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
const R2_SIGNED_URL_TTL_SECONDS = parseInt(process.env.R2_SIGNED_URL_TTL_SECONDS || '600', 10);

function isR2Configured() {
    return Boolean(
        R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_PUBLIC && R2_BUCKET_PRIVATE
    );
}

let client = null;
function getClient() {
    if (!isR2Configured()) return null;
    if (!client) {
        client = new S3Client({
            region: 'auto',
            endpoint: R2_ENDPOINT,
            forcePathStyle: true,
            credentials: {
                accessKeyId: R2_ACCESS_KEY_ID,
                secretAccessKey: R2_SECRET_ACCESS_KEY
            }
        });
    }
    return client;
}

function bucketFor(visibility) {
    return visibility === 'public' ? R2_BUCKET_PUBLIC : R2_BUCKET_PRIVATE;
}

// Uploads a buffer already validated by the caller (mime/size/magic-bytes) —
// this module does no validation of its own, on purpose: it's a thin
// storage adapter, not a security boundary.
async function uploadObject({ key, buffer, contentType, visibility }) {
    const s3 = getClient();
    if (!s3) throw new Error('R2 is not configured (set R2_* environment variables).');
    const bucket = bucketFor(visibility);
    await s3.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType
        })
    );
    return { bucket, key };
}

async function deleteObject({ bucket, key }) {
    const s3 = getClient();
    if (!s3) throw new Error('R2 is not configured (set R2_* environment variables).');
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// Only ever used for the private bucket. Public-bucket files are served via
// buildPublicUrl() below and never need a signature.
async function getSignedDownloadUrl({ bucket, key, downloadFilename }) {
    const s3 = getClient();
    if (!s3) throw new Error('R2 is not configured (set R2_* environment variables).');
    const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: downloadFilename
            ? `attachment; filename="${downloadFilename.replace(/"/g, '')}"`
            : undefined
    });
    return getSignedUrl(s3, command, { expiresIn: R2_SIGNED_URL_TTL_SECONDS });
}

function buildPublicUrl(key) {
    if (!R2_PUBLIC_BASE_URL) return null;
    return `${R2_PUBLIC_BASE_URL}/${key}`;
}

module.exports = {
    isR2Configured,
    uploadObject,
    deleteObject,
    getSignedDownloadUrl,
    buildPublicUrl,
    bucketFor,
    R2_BUCKET_PUBLIC,
    R2_BUCKET_PRIVATE
};

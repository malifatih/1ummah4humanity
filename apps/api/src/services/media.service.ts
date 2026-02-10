import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { MediaType } from '@prisma/client';

// Local uploads directory
const UPLOADS_DIR = path.resolve(
  new URL(import.meta.url).pathname,
  '..', '..', '..', 'uploads',
);

// S3 client (lazy init)
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.AWS_REGION,
      ...(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
            },
          }
        : {}),
    });
  }
  return s3Client;
}

function isLocalMode(): boolean {
  return !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY;
}

function detectMediaType(mimetype: string): MediaType {
  if (mimetype.startsWith('image/gif')) return MediaType.GIF;
  if (mimetype.startsWith('image/')) return MediaType.IMAGE;
  if (mimetype.startsWith('video/')) return MediaType.VIDEO;
  if (mimetype.startsWith('audio/')) return MediaType.AUDIO;
  return MediaType.IMAGE;
}

function getExtension(originalname: string): string {
  const ext = path.extname(originalname);
  return ext || '.bin';
}

function ensureUploadsDir(): void {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function uploadMedia(
  file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
  uploaderId: string
) {
  const mediaType = detectMediaType(file.mimetype);
  const fileId = randomUUID();
  const ext = getExtension(file.originalname);
  const filename = `${fileId}${ext}`;

  let url: string;
  let width: number | null = null;
  let height: number | null = null;
  let thumbnailUrl: string | null = null;

  // Get image dimensions if applicable
  if (mediaType === MediaType.IMAGE) {
    try {
      const metadata = await sharp(file.buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
    } catch {
      // Not a valid image for sharp, continue without dimensions
    }
  }

  if (isLocalMode()) {
    // Local file storage
    ensureUploadsDir();
    const filePath = path.join(UPLOADS_DIR, filename);
    await writeFile(filePath, file.buffer);
    url = `/uploads/${filename}`;

    // Generate thumbnail for images locally
    if (mediaType === MediaType.IMAGE && width && height) {
      try {
        const thumbFilename = `thumb_${fileId}${ext}`;
        const thumbPath = path.join(UPLOADS_DIR, thumbFilename);
        await sharp(file.buffer).resize(150, 150, { fit: 'cover' }).toFile(thumbPath);
        thumbnailUrl = `/uploads/${thumbFilename}`;
      } catch {
        // Thumbnail generation failed, continue without it
      }
    }
  } else {
    // S3 upload
    const key = `media/${filename}`;
    const client = getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    url = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

    // Generate and upload thumbnail for images
    if (mediaType === MediaType.IMAGE && width && height) {
      try {
        const thumbBuffer = await sharp(file.buffer)
          .resize(150, 150, { fit: 'cover' })
          .toBuffer();
        const thumbKey = `media/thumb_${fileId}${ext}`;
        await client.send(
          new PutObjectCommand({
            Bucket: env.S3_BUCKET,
            Key: thumbKey,
            Body: thumbBuffer,
            ContentType: file.mimetype,
          })
        );
        thumbnailUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${thumbKey}`;
      } catch {
        // Thumbnail generation failed, continue without it
      }
    }
  }

  const media = await prisma.media.create({
    data: {
      uploaderId,
      url,
      thumbnailUrl,
      type: mediaType,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      width,
      height,
    },
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      type: true,
      mimeType: true,
      sizeBytes: true,
      width: true,
      height: true,
      createdAt: true,
    },
  });

  return media;
}

export async function getPresignedUploadUrl(
  uploaderId: string,
  filename: string,
  contentType: string
) {
  if (isLocalMode()) {
    throw new AppError(400, 'Presigned URLs are only available in production with S3 configured');
  }

  const mediaType = detectMediaType(contentType);
  const fileId = randomUUID();
  const ext = getExtension(filename);
  const key = `media/${fileId}${ext}`;
  const url = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;

  // Create pending media record
  const media = await prisma.media.create({
    data: {
      uploaderId,
      url,
      type: mediaType,
      mimeType: contentType,
    },
    select: { id: true, url: true },
  });

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

  return {
    mediaId: media.id,
    uploadUrl: presignedUrl,
    url: media.url,
  };
}

export async function confirmUpload(mediaId: string, userId: string) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, uploaderId: true },
  });
  if (!media) throw new AppError(404, 'Media not found');
  if (media.uploaderId !== userId) throw new AppError(403, 'Not authorized');

  // Media exists and belongs to user - it's confirmed
  return { confirmed: true, mediaId };
}

export async function deleteMedia(mediaId: string, userId: string) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, uploaderId: true, url: true, thumbnailUrl: true },
  });
  if (!media) throw new AppError(404, 'Media not found');
  if (media.uploaderId !== userId) throw new AppError(403, 'Not authorized to delete this media');

  if (isLocalMode()) {
    // Delete local files
    const filename = media.url.replace('/uploads/', '');
    const filePath = path.join(UPLOADS_DIR, filename);
    try {
      await unlink(filePath);
    } catch {
      // File might not exist, continue
    }
    if (media.thumbnailUrl) {
      const thumbFilename = media.thumbnailUrl.replace('/uploads/', '');
      const thumbPath = path.join(UPLOADS_DIR, thumbFilename);
      try {
        await unlink(thumbPath);
      } catch {
        // Thumbnail might not exist, continue
      }
    }
  } else {
    // Delete from S3
    const client = getS3Client();
    const key = media.url.split('.amazonaws.com/')[1];
    if (key) {
      await client.send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
      );
    }
    if (media.thumbnailUrl) {
      const thumbKey = media.thumbnailUrl.split('.amazonaws.com/')[1];
      if (thumbKey) {
        await client.send(
          new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: thumbKey })
        );
      }
    }
  }

  await prisma.media.delete({ where: { id: mediaId } });
}

export async function processImage(mediaId: string) {
  const media = await prisma.media.findUnique({
    where: { id: mediaId },
    select: { id: true, url: true, type: true, uploaderId: true },
  });
  if (!media) throw new AppError(404, 'Media not found');
  if (media.type !== MediaType.IMAGE) throw new AppError(400, 'Media is not an image');

  const sizes = [
    { name: 'thumb', width: 150 },
    { name: 'medium', width: 600 },
    { name: 'large', width: 1200 },
  ];

  if (isLocalMode()) {
    // Read original file
    const filename = media.url.replace('/uploads/', '');
    const originalPath = path.join(UPLOADS_DIR, filename);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);

    const image = sharp(originalPath);
    const metadata = await image.metadata();

    for (const size of sizes) {
      const resizedFilename = `${baseName}_${size.name}${ext}`;
      const resizedPath = path.join(UPLOADS_DIR, resizedFilename);
      await sharp(originalPath)
        .resize(size.width, undefined, { fit: 'inside', withoutEnlargement: true })
        .toFile(resizedPath);
    }

    const thumbFilename = `${baseName}_thumb${ext}`;
    const thumbnailUrl = `/uploads/${thumbFilename}`;

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        thumbnailUrl,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });
  } else {
    // For S3: download, process, re-upload
    const key = media.url.split('.amazonaws.com/')[1];
    if (!key) throw new AppError(500, 'Invalid media URL');

    const ext = path.extname(key);
    const baseName = path.basename(key, ext);
    const dirName = path.dirname(key);
    const client = getS3Client();

    // We need to fetch the file from S3 first
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const response = await client.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
    );

    const chunks: Buffer[] = [];
    const stream = response.Body as any;
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    const metadata = await sharp(buffer).metadata();

    for (const size of sizes) {
      const resizedBuffer = await sharp(buffer)
        .resize(size.width, undefined, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();

      const resizedKey = `${dirName}/${baseName}_${size.name}${ext}`;
      await client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: resizedKey,
          Body: resizedBuffer,
          ContentType: `image/${ext.replace('.', '') || 'jpeg'}`,
        })
      );
    }

    const thumbKey = `${dirName}/${baseName}_thumb${ext}`;
    const thumbnailUrl = `https://${env.S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${thumbKey}`;

    await prisma.media.update({
      where: { id: mediaId },
      data: {
        thumbnailUrl,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
      },
    });
  }

  return prisma.media.findUnique({
    where: { id: mediaId },
    select: {
      id: true,
      url: true,
      thumbnailUrl: true,
      type: true,
      width: true,
      height: true,
    },
  });
}

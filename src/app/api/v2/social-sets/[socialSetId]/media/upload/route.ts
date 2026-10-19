import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExplicitBearerOrSession, recordAuditLog } from '@/lib/account-admission';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'application/pdf',
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  try {
    await verifyExplicitBearerOrSession(request);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }

  const { socialSetId } = await context.params;
  const assets = await prisma.mediaAsset.findMany({
    where: { socialSetId: Number(socialSetId) },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ results: assets });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot upload media.' },
        { status: 403 }
      );
    }

    const { socialSetId } = await context.params;
    const setId = Number(socialSetId);
    const contentType = request.headers.get('content-type') || '';

    let fileName = 'attachment.png';
    let mimeType = 'image/png';
    let altText = '';
    let sizeBytes = 0;
    let url = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      altText = String(formData.get('alt_text') || formData.get('altText') || '');

      if (!file) {
        return NextResponse.json(
          { error: 'Form field "file" is required for multipart upload.' },
          { status: 400 }
        );
      }

      fileName = file.name || 'upload.bin';
      mimeType = file.type || 'application/octet-stream';
      sizeBytes = file.size;

      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        return NextResponse.json(
          { error: `Unsupported media MIME type: ${mimeType}` },
          { status: 400 }
        );
      }

      const ext = path.extname(fileName) || '.bin';
      const safeDiskName = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'media');
      await fs.mkdir(uploadDir, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(path.join(uploadDir, safeDiskName), buffer);
      url = `/uploads/media/${safeDiskName}`;
    } else {
      const body = await request.json().catch(() => ({}));
      fileName = String(body.file_name || body.fileName || 'attachment.png');
      mimeType = String(body.mime_type || body.mimeType || 'image/png');
      altText = String(body.alt_text || body.altText || '');
      sizeBytes = Number(body.size_bytes || body.sizeBytes || 4096);

      if (typeof body.data_url === 'string' && body.data_url.startsWith('data:')) {
        const match = body.data_url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          const buffer = Buffer.from(match[2], 'base64');
          sizeBytes = buffer.length;
          const ext = path.extname(fileName) || '.png';
          const safeDiskName = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'media');
          await fs.mkdir(uploadDir, { recursive: true });
          await fs.writeFile(path.join(uploadDir, safeDiskName), buffer);
          url = `/uploads/media/${safeDiskName}`;
        }
      }

      if (!url) {
        url = String(
          body.url ||
            (mimeType === 'application/pdf'
              ? '/media/linkedin-carousel-guide.pdf'
              : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(fileName)}`)
        );
      }
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        socialSetId: setId,
        fileName,
        mimeType,
        url,
        altText,
        status: 'ready',
      },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'media.upload',
      targetType: 'MediaAsset',
      targetId: asset.id,
      metadata: { socialSetId: setId, fileName, mimeType, sizeBytes },
    });

    return NextResponse.json(
      {
        media_id: asset.id,
        id: asset.id,
        file_name: asset.fileName,
        mime_type: asset.mimeType,
        alt_text: asset.altText,
        size_bytes: sizeBytes,
        url: asset.url,
        upload_url: `${asset.url}?presigned=1`,
        status: asset.status,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Media upload failed.' },
      { status: err?.status || 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot modify media.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.media_id || body.id || '');
    const altText = String(body.alt_text || body.altText || '');

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: { altText },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update media.' },
      { status: err?.status || 400 }
    );
  }
}

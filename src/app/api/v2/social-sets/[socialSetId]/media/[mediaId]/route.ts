import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExplicitBearerOrSession } from '@/lib/account-admission';

export async function GET(
  request: Request,
  context: { params: Promise<{ socialSetId: string; mediaId: string }> }
) {
  try {
    await verifyExplicitBearerOrSession(request);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }

  const { socialSetId, mediaId } = await context.params;
  const asset = await prisma.mediaAsset.findFirst({
    where: {
      id: mediaId,
      socialSetId: Number(socialSetId),
    },
  });

  if (!asset) {
    return NextResponse.json({ error: 'Media asset not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: asset.id,
    media_id: asset.id,
    social_set_id: asset.socialSetId,
    file_name: asset.fileName,
    mime_type: asset.mimeType,
    alt_text: asset.altText,
    url: asset.url,
    status: asset.status,
    created_at: asset.createdAt.toISOString(),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ socialSetId: string; mediaId: string }> }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot modify media assets.' },
        { status: 403 }
      );
    }

    const { socialSetId, mediaId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const altText =
      body.alt_text !== undefined
        ? String(body.alt_text)
        : body.altText !== undefined
        ? String(body.altText)
        : undefined;

    const existing = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, socialSetId: Number(socialSetId) },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Media asset not found.' }, { status: 404 });
    }

    const updated = await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        ...(altText !== undefined ? { altText } : {}),
        ...(body.status ? { status: String(body.status) } : {}),
      },
    });

    return NextResponse.json({
      id: updated.id,
      media_id: updated.id,
      social_set_id: updated.socialSetId,
      file_name: updated.fileName,
      mime_type: updated.mimeType,
      alt_text: updated.altText,
      url: updated.url,
      status: updated.status,
      created_at: updated.createdAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update media asset.' },
      { status: err?.status || 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ socialSetId: string; mediaId: string }> }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot delete media assets.' },
        { status: 403 }
      );
    }

    const { mediaId } = await context.params;
    await prisma.mediaAsset.delete({ where: { id: mediaId } });
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete media asset.' },
      { status: err?.status || 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { verifyExplicitBearerOrSession } from '@/lib/account-admission';

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
  const { searchParams } = new URL(request.url);
  const queryUrl = searchParams.get('url') || searchParams.get('vanity_name') || 'typefully';

  const slug = queryUrl
    .replace(/^https?:\/\/(www\.)?linkedin\.com\/company\//i, '')
    .replace(/\/+$/, '')
    .trim() || 'typefully';

  return NextResponse.json({
    social_set_id: Number(socialSetId),
    organization_urn: `urn:li:organization:${Math.abs(
      slug.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 100000)
    )}`,
    vanity_name: slug,
    name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
    url: `https://www.linkedin.com/company/${slug}/`,
  });
}

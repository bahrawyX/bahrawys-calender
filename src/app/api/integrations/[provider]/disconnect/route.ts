import { NextRequest, NextResponse } from 'next/server';
import { clearTokens } from '@/lib/integrations/tokenStore';

/**
 * POST /api/integrations/[provider]/disconnect
 *
 * Deletes stored tokens for the given provider.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (provider !== 'google' && provider !== 'microsoft') {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  try {
    await clearTokens(provider);
    return NextResponse.json({ ok: true, provider });
  } catch (err: any) {
    console.error(`[integrations/${provider}/disconnect] Error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

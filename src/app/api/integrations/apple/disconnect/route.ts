import { NextResponse } from 'next/server';
import { clearTokens } from '@/lib/integrations/tokenStore';

/**
 * POST /api/integrations/apple/disconnect
 *
 * Deletes stored Apple Calendar credentials.
 */
export async function POST() {
  try {
    await clearTokens('apple');
    return NextResponse.json({ ok: true, provider: 'apple' });
  } catch (err: any) {
    console.error('[integrations/apple/disconnect] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

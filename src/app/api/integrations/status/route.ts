import { NextResponse } from 'next/server';
import { isConnected } from '@/lib/integrations/tokenStore';

/**
 * GET /api/integrations/status
 *
 * Returns the connection status for each configured provider.
 * A provider is "connected" if we have valid (or refreshable) tokens.
 */
export async function GET() {
  try {
    const [googleConnected, microsoftConnected] = await Promise.all([
      process.env.GOOGLE_CLIENT_ID ? isConnected('google') : false,
      process.env.OUTLOOK_CLIENT_ID ? isConnected('microsoft') : false,
    ]);

    return NextResponse.json({
      google: {
        connected: googleConnected,
        configured: !!process.env.GOOGLE_CLIENT_ID,
      },
      microsoft: {
        connected: microsoftConnected,
        configured: !!process.env.OUTLOOK_CLIENT_ID,
      },
    });
  } catch (err) {
    console.error('[integrations/status] Error:', err);
    return NextResponse.json(
      { google: { connected: false }, microsoft: { connected: false } },
      { status: 500 },
    );
  }
}

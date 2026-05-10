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
    const [googleConnected, microsoftConnected, appleConnected] = await Promise.all([
      process.env.GOOGLE_CLIENT_ID ? isConnected('google') : false,
      process.env.OUTLOOK_CLIENT_ID ? isConnected('microsoft') : false,
      isConnected('apple'), // Apple uses credentials, no env config needed
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
      apple: {
        connected: appleConnected,
        configured: true, // Apple Calendar always available (no API keys needed)
      },
    });
  } catch (err) {
    console.error('[integrations/status] Error:', err);
    return NextResponse.json(
      { google: { connected: false }, microsoft: { connected: false }, apple: { connected: false } },
      { status: 500 },
    );
  }
}

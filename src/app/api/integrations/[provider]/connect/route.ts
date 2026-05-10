import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/integrations/google';
import { getMicrosoftAuthUrl } from '@/lib/integrations/microsoft';

/**
 * GET /api/integrations/[provider]/connect
 *
 * Redirects the user to the OAuth provider's authorization page.
 * Called from a popup window — after auth the callback will post
 * a message back to the opener and close.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;

  if (provider === 'google') {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return new NextResponse(
        'Google Calendar integration is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local file.',
        { status: 500 },
      );
    }
    return NextResponse.redirect(getGoogleAuthUrl());
  }

  if (provider === 'microsoft') {
    if (!process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
      return new NextResponse(
        'Outlook integration is not configured. Set OUTLOOK_CLIENT_ID and OUTLOOK_CLIENT_SECRET in your .env.local file.',
        { status: 500 },
      );
    }
    return NextResponse.redirect(getMicrosoftAuthUrl());
  }

  return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
}

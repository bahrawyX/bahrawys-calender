import { NextRequest, NextResponse } from 'next/server';
import { validateAppleCredentials } from '@/lib/integrations/apple';
import { setTokens } from '@/lib/integrations/tokenStore';

/**
 * POST /api/integrations/apple/connect
 *
 * Unlike Google/Outlook (OAuth popup flow), Apple Calendar uses
 * CalDAV with Basic auth. The client sends Apple ID email +
 * app-specific password, we validate and store in encrypted cookie.
 *
 * Body: { email: string, appPassword: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, appPassword } = body;

    if (!email || !appPassword) {
      return NextResponse.json(
        { error: 'Apple ID email and app-specific password are required' },
        { status: 400 },
      );
    }

    // Validate credentials by making a CalDAV PROPFIND request
    await validateAppleCredentials({ email, appPassword });

    // Store credentials in encrypted cookie (same system as OAuth tokens)
    // We encode the credentials as JSON in the accessToken field
    await setTokens('apple', {
      accessToken: JSON.stringify({ email, appPassword }),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year (app passwords don't expire)
      scope: 'caldav',
    });

    return NextResponse.json({ ok: true, provider: 'apple' });
  } catch (err: any) {
    console.error('[integrations/apple/connect] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to connect Apple Calendar' },
      { status: 400 },
    );
  }
}

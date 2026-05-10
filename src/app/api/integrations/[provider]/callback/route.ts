import { NextRequest, NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/integrations/google';
import { exchangeMicrosoftCode } from '@/lib/integrations/microsoft';
import { setTokens } from '@/lib/integrations/tokenStore';

/**
 * GET /api/integrations/[provider]/callback
 *
 * OAuth callback handler. Exchanges the authorization code for tokens,
 * stores them in an encrypted cookie, then renders a small HTML page
 * that posts `lumina:oauth-complete` to the opener window and closes.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return renderPopupClose(false, `OAuth error: ${error}`);
  }
  if (!code) {
    return renderPopupClose(false, 'No authorization code received');
  }

  try {
    if (provider === 'google') {
      const tokens = await exchangeGoogleCode(code);
      await setTokens('google', {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope,
      });
      return renderPopupClose(true);
    }

    if (provider === 'microsoft') {
      const tokens = await exchangeMicrosoftCode(code);
      await setTokens('microsoft', {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        scope: tokens.scope,
      });
      return renderPopupClose(true);
    }

    return renderPopupClose(false, `Unknown provider: ${provider}`);
  } catch (err: any) {
    console.error(`[integrations/${provider}/callback] Error:`, err);
    return renderPopupClose(false, err.message || 'Token exchange failed');
  }
}

function renderPopupClose(success: boolean, error?: string) {
  const html = `
<!DOCTYPE html>
<html>
<head><title>Lumina Calendar — Connecting...</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;background:#131316;color:#e5e5e5;">
  <div style="text-align:center;">
    <p>${success ? 'Connected successfully! This window will close.' : `Connection failed: ${error ?? 'Unknown error'}`}</p>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage({
          type: 'lumina:oauth-complete',
          success: ${success},
          error: ${error ? JSON.stringify(error) : 'null'},
        }, '*');
      }
    } catch (e) {}
    setTimeout(() => window.close(), ${success ? 1000 : 3000});
  </script>
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

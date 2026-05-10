import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const FILTERS_COOKIE = 'int_cal_filters';

/**
 * PATCH /api/integrations/calendars/[id]
 *
 * Toggles the `enabled` state for a specific external calendar.
 * The ID is `provider:calendarId` (e.g. `google:primary`).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const calId = decodeURIComponent(id);

  try {
    const body = await req.json();
    const enabled = !!body.enabled;

    // Read existing filter state
    const jar = await cookies();
    const raw = jar.get(FILTERS_COOKIE)?.value;
    const filters: Record<string, boolean> = raw ? JSON.parse(raw) : {};

    // Update
    filters[calId] = enabled;

    // Persist
    jar.set(FILTERS_COOKIE, JSON.stringify(filters), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ ok: true, id: calId, enabled });
  } catch (err: any) {
    console.error(`[calendars/${calId}] Error:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

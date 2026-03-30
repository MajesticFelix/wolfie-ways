import { NextRequest, NextResponse } from 'next/server';

const SPOT_BASE = 'https://stonybrook.etaspot.net/service.php';
const TOKEN = process.env.SPOT_API_TOKEN ?? 'TESTING';

const VALID_SERVICES = new Set([
  'get_routes',
  'get_stops',
  'get_vehicles',
  'get_stop_etas',
  'get_schedules',
  'get_service_announcements',
  'get_patterns',
  'get_active_patterns',
  'get_stopimages',
  'get_version_id',
]);

// Live data services — no cache
const NO_CACHE_SERVICES = new Set([
  'get_vehicles',
  'get_stop_etas',
  'get_service_announcements',
  'get_active_patterns',
  'get_version_id',
]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;

  if (!VALID_SERVICES.has(service)) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }

  const incomingParams = request.nextUrl.searchParams;
  const upstream = new URL(SPOT_BASE);
  upstream.searchParams.set('service', service);
  upstream.searchParams.set('token', TOKEN);

  // Forward allowed query params
  const allowedParams = ['stopID', 'includeETAData', 'inService', 'orderedETAArray', 'statusData'];
  for (const key of allowedParams) {
    const val = incomingParams.get(key);
    if (val !== null) upstream.searchParams.set(key, val);
  }

  try {
    const res = await fetch(upstream.toString(), {
      next: NO_CACHE_SERVICES.has(service) ? { revalidate: 0 } : { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }

    const data = await res.json();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (NO_CACHE_SERVICES.has(service)) {
      headers['Cache-Control'] = 'no-store';
    } else {
      headers['Cache-Control'] = 'public, s-maxage=300, stale-while-revalidate=60';
    }

    return NextResponse.json(data, { headers });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch upstream data' }, { status: 502 });
  }
}

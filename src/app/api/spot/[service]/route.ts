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

// CDN s-maxage per service (seconds). Vercel's CDN caches GET responses by
// full URL, so concurrent users share one cached response per window —
// reducing upstream requests and serverless invocations to O(1) per window.
const SERVICE_TTL: Record<string, number> = {
  get_vehicles: 5,
  get_stop_etas: 5,
  get_service_announcements: 10,
  get_active_patterns: 10,
  get_version_id: 30,
  get_schedules: 60,
  get_routes: 300,
  get_stops: 300,
  get_patterns: 300,
  get_stopimages: 300,
};

const allowedParams = ['stopID', 'includeETAData', 'inService', 'orderedETAArray', 'statusData'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const { service } = await params;

  if (!VALID_SERVICES.has(service)) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }

  const ttl = SERVICE_TTL[service] ?? 10;
  const incomingParams = request.nextUrl.searchParams;
  const upstream = new URL(SPOT_BASE);
  upstream.searchParams.set('service', service);
  upstream.searchParams.set('token', TOKEN);

  for (const key of allowedParams) {
    const val = incomingParams.get(key);
    if (val !== null) upstream.searchParams.set(key, val);
  }

  try {
    const res = await fetch(upstream.toString(), {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=${Math.floor(ttl / 2)}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch upstream data' }, { status: 502 });
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Fixed-window in-memory rate limiter.
// Vercel Fluid Compute reuses function instances across concurrent requests,
// so this provides meaningful per-IP protection with zero external dependencies.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;  // per IP per window

interface WindowState {
  count: number;
  reset: number; // epoch ms when the window expires
}

const store = new Map<string, WindowState>();
let lastPrune = 0;

function maybePrune(now: number) {
  if (now - lastPrune < WINDOW_MS) return;
  lastPrune = now;
  for (const [ip, state] of store) {
    if (now >= state.reset) store.delete(ip);
  }
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

export function proxy(request: NextRequest): NextResponse {
  const now = Date.now();
  maybePrune(now);

  const ip = getClientIp(request);
  let state = store.get(ip);

  if (!state || now >= state.reset) {
    state = { count: 1, reset: now + WINDOW_MS };
    store.set(ip, state);
    return NextResponse.next();
  }

  if (state.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((state.reset - now) / 1000);
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_REQUESTS),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(state.reset / 1000)),
        },
      }
    );
  }

  state.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/spot/:path*',
};

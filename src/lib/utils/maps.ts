// Helper utilities for map operations

/** Returns heading as a CSS rotation string for marker arrows */
export function headingToRotation(heading: number): string {
  return `rotate(${heading}deg)`;
}

/** Returns a compass direction abbreviation from degrees */
export function headingToCompass(heading: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(heading / 45) % 8];
}

/** Format seconds into a human-readable ETA string */
export function formatEtaSeconds(seconds: number): string {
  if (seconds < 0) return '—';
  if (seconds < 60) return '<1 min';
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

/** Format minutes into a readable ETA string */
export function formatEtaMinutes(minutes: number): string {
  if (minutes <= 0) return 'Arriving';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

/** Get unique stops (deduplicated by id) */
export function deduplicateStops<T extends { id: number }>(stops: T[]): T[] {
  const seen = new Set<number>();
  return stops.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

/** Pad hex color with # if missing */
export function normalizeColor(color: string): string {
  if (!color) return '#3B82F6';
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Normalize color and, in dark mode, replace near-black colors with a
 * visible light gray so routes like Railroad remain legible.
 */
export function resolveRouteColor(color: string, isDark: boolean): string {
  let c = normalizeColor(color);
  // Expand 3-digit hex → 6-digit
  if (c.length === 4) c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  if (c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    // Replace near-black (e.g. Railroad) with a softer color in both modes
    if (!isNaN(r + g + b) && r < 40 && g < 40 && b < 40) {
      return isDark ? '#C7C7C9' : '#626267ff';
    }
  }
  return c;
}

/**
 * Split a decoded polyline path wherever consecutive vertices are more than
 * `maxDistDeg` degrees apart (straight-line). Returns the sub-paths and the
 * original-path index at which each sub-path starts.
 *
 * This removes spurious long-haul segments (e.g. Railroad SAC → LIRR) that
 * exist in the SPOT API encoded line data.
 */
export function splitPathAtJumps(
  path: google.maps.LatLng[],
  maxDistDeg = 0.005,
): { paths: google.maps.LatLng[][]; startIndices: number[] } {
  if (path.length === 0) return { paths: [], startIndices: [] };
  const paths: google.maps.LatLng[][] = [];
  const startIndices: number[] = [0];
  let current: google.maps.LatLng[] = [path[0]];
  for (let i = 1; i < path.length; i++) {
    const dlat = path[i].lat() - path[i - 1].lat();
    const dlng = path[i].lng() - path[i - 1].lng();
    if (Math.sqrt(dlat * dlat + dlng * dlng) > maxDistDeg) {
      paths.push(current);
      current = [path[i]];
      startIndices.push(i);
    } else {
      current.push(path[i]);
    }
  }
  paths.push(current);
  return { paths, startIndices };
}

/** Compute load percentage */
export function loadPercent(load: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.round((load / capacity) * 100));
}

/** Parse amenities string into an array */
export function parseAmenities(amenities: string): string[] {
  if (!amenities) return [];
  return amenities.split(',').map((a) => a.trim()).filter(Boolean);
}

/** Haversine distance in meters between two lat/lng points */
export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Center of Stony Brook University campus */
export const SBU_CENTER = { lat: 40.9122, lng: -73.1233 };
export const SBU_DEFAULT_ZOOM = 15;

/**
 * Normalize a SPOT API time string to "H:MM AM/PM" format.
 * The API already returns 12-hour strings like "08:32AM" or "8:45AM" in EST.
 * We just add a space before the meridiem and strip the leading zero — never
 * recalculate AM/PM from the hour, which would corrupt PM times < 12.
 */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  // Match "H:MM" or "HH:MM" optionally followed by AM/PM (with or without space)
  const match = timeStr.match(/^(\d{1,2}):(\d{2})(?::?\d{2})?\s*(am|pm)?$/i);
  if (!match) return timeStr;
  const hours = parseInt(match[1], 10); // strips leading zero via parseInt
  const minutes = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    return `${hours}:${minutes} ${meridiem}`;
  }
  // Fallback: input was bare 24-hour — convert
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${h12}:${minutes} ${ampm}`;
}

/** Image URL helper */
export function stopImageUrl(relativePath: string): string {
  return `https://stonybrook.etaspot.net/${relativePath}`;
}

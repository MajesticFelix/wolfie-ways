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

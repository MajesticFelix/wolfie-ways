import type {
  RoutesResponse,
  StopsResponse,
  VehiclesResponse,
  StopETAsResponse,
  SchedulesResponse,
  AnnouncementsResponse,
  PatternsResponse,
  StopImagesResponse,
  VersionResponse,
  Route,
  Stop,
  Vehicle,
  StopETA,
  Schedule,
  AnnouncementGroup,
  Pattern,
  StopImage,
} from './types';

const SPOT_BASE = 'https://stonybrook.etaspot.net/service.php';
const TOKEN = process.env.SPOT_API_TOKEN ?? 'TESTING';

async function spotFetchServer<T>(
  service: string,
  params?: Record<string, string>,
  revalidate: number | false = false,
): Promise<T> {
  const url = new URL(SPOT_BASE);
  url.searchParams.set('service', service);
  url.searchParams.set('token', TOKEN);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });
  if (!res.ok) throw new Error(`SPOT upstream error: ${service} ${res.status}`);
  return res.json();
}

// Static data (cached 5 min)
export async function getRoutes(): Promise<Route[]> {
  const data = await spotFetchServer<RoutesResponse>('get_routes', undefined, 300);
  return data.get_routes ?? [];
}

export async function getStops(): Promise<Stop[]> {
  const data = await spotFetchServer<StopsResponse>('get_stops', undefined, 300);
  return data.get_stops ?? [];
}

export async function getPatterns(): Promise<Pattern[]> {
  const data = await spotFetchServer<PatternsResponse>('get_patterns', undefined, 300);
  return data.get_patterns ?? [];
}

export async function getStopImages(): Promise<StopImage[]> {
  const data = await spotFetchServer<StopImagesResponse>('get_stopimages', undefined, 300);
  return data.get_stopimages ?? [];
}

// Live data — revalidate matches client poll intervals so all concurrent users
// share one cached upstream fetch per window instead of one per user.
export async function getVersionId(): Promise<number> {
  const data = await spotFetchServer<VersionResponse>('get_version_id', undefined, 30);
  return data.versionID ?? 0;
}

export async function getVehicles(): Promise<Vehicle[]> {
  const data = await spotFetchServer<VehiclesResponse>('get_vehicles', {
    includeETAData: '1',
    inService: '1',
    orderedETAArray: '1',
  }, 10);
  return data.get_vehicles ?? [];
}

export async function getStopETAs(stopID: number): Promise<StopETA[]> {
  const data = await spotFetchServer<StopETAsResponse>('get_stop_etas', {
    stopID: String(stopID),
    statusData: '1',
  }, 10);
  return data.get_stop_etas ?? [];
}

export async function getSchedules(stopID: number): Promise<Schedule[]> {
  const data = await spotFetchServer<SchedulesResponse>('get_schedules', {
    stopID: String(stopID),
    includeETAData: '1',
    orderedETAArray: '1',
  }, 60);
  return data.get_schedules ?? [];
}

export async function getAnnouncements(): Promise<AnnouncementGroup[]> {
  const data = await spotFetchServer<AnnouncementsResponse>('get_service_announcements', undefined, 10);
  return data.get_service_announcements ?? [];
}

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

async function spotFetch<T>(service: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`/api/spot/${service}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`SPOT API error: ${service} ${res.status}`);
  return res.json();
}

export async function fetchRoutes(): Promise<Route[]> {
  const data = await spotFetch<RoutesResponse>('get_routes');
  return data.get_routes ?? [];
}

export async function fetchStops(): Promise<Stop[]> {
  const data = await spotFetch<StopsResponse>('get_stops');
  return data.get_stops ?? [];
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const data = await spotFetch<VehiclesResponse>('get_vehicles', {
    includeETAData: '1',
    inService: '1',
    orderedETAArray: '1',
  });
  return data.get_vehicles ?? [];
}

export async function fetchStopETAs(stopID: number): Promise<StopETA[]> {
  const data = await spotFetch<StopETAsResponse>('get_stop_etas', {
    stopID: String(stopID),
    statusData: '1',
  });
  return data.get_stop_etas ?? [];
}

export async function fetchSchedules(stopID: number): Promise<Schedule[]> {
  const data = await spotFetch<SchedulesResponse>('get_schedules', {
    stopID: String(stopID),
    includeETAData: '1',
    orderedETAArray: '1',
  });
  return data.get_schedules ?? [];
}

export async function fetchAnnouncements(): Promise<AnnouncementGroup[]> {
  const data = await spotFetch<AnnouncementsResponse>('get_service_announcements');
  return data.get_service_announcements ?? [];
}

export async function fetchPatterns(): Promise<Pattern[]> {
  const data = await spotFetch<PatternsResponse>('get_patterns');
  return data.get_patterns ?? [];
}

export async function fetchStopImages(): Promise<StopImage[]> {
  const data = await spotFetch<StopImagesResponse>('get_stopimages');
  return data.get_stopimages ?? [];
}

export async function fetchVersionId(): Promise<number> {
  const data = await spotFetch<VersionResponse>('get_version_id');
  return data.versionID ?? 0;
}

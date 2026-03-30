// SPOT Bus API Types

export interface Route {
  id: number;
  name: string;
  abbr: string;
  stops: number[];
  vType: string;
  encLine: string;
  color: string;
  type: string;
  order: number;
  showDirection?: boolean;
  showPlatform?: boolean;
  showScheduleNumber?: number;
  useCustomShape?: number;
  showVehicleCapacity?: boolean;
}

export interface Stop {
  id: number;
  rid: number;
  rsid: number;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  extID: string;
}

export interface Vehicle {
  equipmentID: string;
  routeID: number;
  patternID: number;
  lat: number;
  lng: number;
  h: number; // heading degrees 0-360
  load: number;
  capacity: number;
  eLoad: number;
  bkSlots: number | null;
  wcSlots: number | null;
  bkUsed: number;
  wcUsed: number;
  inService: number;
  scheduleNumber: string;
  nextStopID: number;
  nextStopETA: number; // seconds, -1 = unavailable
  nextPatternStopID: number;
  lastStopID: number;
  lastPatternStopID: number;
  blockID: number;
  tripID: number | null;
  vehicleType: string;
  trainID: number;
  deadHead: number;
  onSchedule: string | null;
  receiveTime: number; // unix ms
  aID: string;
  minutesToNextStops?: ETAEntry[]; // Ordered upcoming stop ETAs, populated with includeETAData=1&orderedETAArray=1
}

export interface ETAEntry {
  minutes: number;
  time: string;
  schedule: string;
  status: string;
  routeID: number;
  scheduleNumber: string;
  stopID: number;
  patternStopID: number;
  timePoint: number;
  track: number;
  direction: string;
  directionAbbr: string;
  equipmentID: string;
}

export interface StopETA {
  id: string | number;
  enRoute: ETAEntry[];
}

export interface Schedule {
  corridorID: number;
  runID: number;
  scheduleNumber: string;
  scheduleID: number;
  scheduleName: string;
  stationID: number;
  stationName: string;
  patternStopID: number;
  stopTime: string;
  timePoint: number;
  weekdays: string;
  direction: string;
  directionLabel: string;
  track: string;
}

export interface AnnouncementEntry {
  text: string;
  start: string;
  end: string;
  cause: string;
  effect: string;
  source: string;
}

export interface AnnouncementGroup {
  type: 'high' | 'normal';
  announcements: AnnouncementEntry[];
}

export interface Pattern {
  id: number;
  name: string;
  type: number;
  length: number;
  color: string;
  encLine: string;
  decLine: unknown[];
  routes: number[];
  routeNames: string[];
  stations: unknown[];
  stopIDs: number[];
  extID: string | null;
}

export interface StopImage {
  stopid: number;
  type: string;
  stoplocdesc: string;
  amenities: string;
  comments: string;
  images: string[];
}

// API Response wrappers
export interface RoutesResponse { get_routes: Route[] }
export interface StopsResponse { get_stops: Stop[] }
export interface VehiclesResponse { get_vehicles: Vehicle[] }
export interface StopETAsResponse { get_stop_etas: StopETA[] }
export interface SchedulesResponse { get_schedules: Schedule[] }
export interface AnnouncementsResponse { get_service_announcements: AnnouncementGroup[] }
export interface PatternsResponse { get_patterns: Pattern[] }
export interface ActivePatternsResponse { get_active_patterns: { errors: unknown[]; result: Record<string, unknown> } }
export interface StopImagesResponse { get_stopimages: StopImage[] }
export interface VersionResponse { versionID: number }

// Special sentinel values
export const UNASSIGNED_ROUTE_ID = 777;
export const UNASSIGNED_PATTERN_ID = 9998;
export const NOT_IN_SERVICE = 'NIS';

'use client';

import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';

// ── localStorage helpers ─────────────────────────────────────
const SELECTED_ROUTES_KEY = 'wolfie-selected-routes';
const PINNED_ROUTES_KEY = 'wolfie-pinned-routes';

function loadSet(key: string): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {}
  return new Set();
}

function saveSet(key: string, set: Set<number>): void {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {}
}

interface TransitState {
  selectedRoutes: Set<number>;
  pinnedRoutes: Set<number>;
  previousSelectedRoutes: Set<number> | null; // saved by SELECT_STOP_WITH_ROUTE_FILTER, restored on CLEAR_SELECTION
  selectedStop: number | null;
  selectedBus: string | null;
  busSelectionKey: number; // increments on every SELECT_BUS, even for the same bus
  panelMode: 'stop' | 'bus' | null;
  drawerView: 'home' | 'stop' | 'bus'; // mobile bottom sheet view
  mapTarget: { lat: number; lng: number; zoom?: number } | null;
  previousBus: string | null;   // set when navigating: bus → stop
  previousStop: number | null;  // set when navigating: stop → bus
}

type Action =
  | { type: 'LOAD_PERSISTED'; selectedRoutes: Set<number>; pinnedRoutes: Set<number> }
  | { type: 'TOGGLE_ROUTE'; routeId: number }
  | { type: 'SELECT_ALL_ROUTES' }
  | { type: 'TOGGLE_PINNED_ROUTE'; routeId: number }
  | { type: 'SELECT_STOP'; stopId: number; fromBusId?: string }
  | { type: 'SELECT_STOP_WITH_ROUTE_FILTER'; stopId: number; routeId: number }
  | { type: 'SELECT_BUS'; busId: string }
  | { type: 'SELECT_BUS_FROM_STOP'; busId: string; fromStopId: number }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'PAN_MAP'; lat: number; lng: number; zoom?: number }
  | { type: 'CLEAR_MAP_TARGET' }
  | { type: 'BACK_TO_BUS' }
  | { type: 'BACK_TO_STOP' }
  | { type: 'SET_DRAWER_VIEW'; view: 'home' | 'stop' | 'bus' };

function reducer(state: TransitState, action: Action): TransitState {
  switch (action.type) {
    case 'LOAD_PERSISTED':
      return { ...state, selectedRoutes: action.selectedRoutes, pinnedRoutes: action.pinnedRoutes };
    case 'TOGGLE_ROUTE': {
      const next = new Set(state.selectedRoutes);
      if (next.has(action.routeId)) next.delete(action.routeId);
      else next.add(action.routeId);
      if (state.panelMode !== null) {
        // User explicitly changed filters while in a panel — discard any saved routes
        return { ...state, selectedRoutes: next, previousSelectedRoutes: null, selectedStop: null, selectedBus: null, panelMode: null, drawerView: 'home', previousBus: null, previousStop: null };
      }
      return { ...state, selectedRoutes: next };
    }
    case 'SELECT_ALL_ROUTES':
      if (state.panelMode !== null) {
        return { ...state, selectedRoutes: new Set(), previousSelectedRoutes: null, selectedStop: null, selectedBus: null, panelMode: null, drawerView: 'home', previousBus: null, previousStop: null };
      }
      return { ...state, selectedRoutes: new Set() };
    case 'TOGGLE_PINNED_ROUTE': {
      const next = new Set(state.pinnedRoutes);
      if (next.has(action.routeId)) next.delete(action.routeId);
      else next.add(action.routeId);
      return { ...state, pinnedRoutes: next };
    }
    case 'SELECT_STOP':
      return {
        ...state,
        selectedStop: action.stopId,
        selectedBus: null,
        panelMode: 'stop',
        drawerView: 'stop',
        previousBus: action.fromBusId ?? null,
        previousStop: null,
      };
    case 'SELECT_STOP_WITH_ROUTE_FILTER':
      return {
        ...state,
        selectedStop: action.stopId,
        selectedRoutes: new Set([action.routeId]),
        previousSelectedRoutes: state.selectedRoutes,
        selectedBus: null,
        panelMode: 'stop',
        drawerView: 'stop',
        previousBus: null,
        previousStop: null,
      };
    case 'SELECT_BUS':
      return {
        ...state,
        selectedBus: action.busId,
        busSelectionKey: state.busSelectionKey + 1,
        selectedStop: null,
        panelMode: 'bus',
        drawerView: 'bus',
        previousBus: null,
        previousStop: null,
      };
    case 'SELECT_BUS_FROM_STOP':
      return {
        ...state,
        selectedBus: action.busId,
        busSelectionKey: state.busSelectionKey + 1,
        selectedStop: null,
        panelMode: 'bus',
        drawerView: 'bus',
        previousBus: null,
        previousStop: action.fromStopId,
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedRoutes: state.previousSelectedRoutes ?? state.selectedRoutes,
        previousSelectedRoutes: null,
        selectedStop: null,
        selectedBus: null,
        panelMode: null,
        drawerView: 'home',
        previousBus: null,
        previousStop: null,
      };
    case 'BACK_TO_BUS':
      if (!state.previousBus) return state;
      return {
        ...state,
        selectedBus: state.previousBus,
        busSelectionKey: state.busSelectionKey + 1,
        selectedStop: null,
        panelMode: 'bus',
        drawerView: 'bus',
        previousBus: null,
        previousStop: null,
      };
    case 'BACK_TO_STOP':
      if (!state.previousStop) return state;
      return {
        ...state,
        selectedStop: state.previousStop,
        selectedBus: null,
        panelMode: 'stop',
        drawerView: 'stop',
        previousStop: null,
        previousBus: null,
      };
    case 'SET_DRAWER_VIEW':
      return { ...state, drawerView: action.view };
    case 'PAN_MAP':
      return { ...state, mapTarget: { lat: action.lat, lng: action.lng, zoom: action.zoom } };
    case 'CLEAR_MAP_TARGET':
      return { ...state, mapTarget: null };
    default:
      return state;
  }
}

function createInitialState(): TransitState {
  return {
    selectedRoutes: new Set(),
    pinnedRoutes: new Set(),
    previousSelectedRoutes: null,
    selectedStop: null,
    selectedBus: null,
    busSelectionKey: 0,
    panelMode: null,
    drawerView: 'home',
    mapTarget: null,
    previousBus: null,
    previousStop: null,
  };
}

interface TransitContextValue {
  state: TransitState;
  toggleRoute: (routeId: number) => void;
  selectAllRoutes: () => void;
  togglePinnedRoute: (routeId: number) => void;
  selectStop: (stopId: number, fromBusId?: string) => void;
  selectStopWithRouteFilter: (stopId: number, routeId: number) => void;
  selectBus: (busId: string) => void;
  selectBusFromStop: (busId: string, fromStopId: number) => void;
  clearSelection: () => void;
  isRouteVisible: (routeId: number) => boolean;
  panMap: (lat: number, lng: number, zoom?: number) => void;
  clearMapTarget: () => void;
  backToBus: () => void;
  backToStop: () => void;
  setDrawerView: (view: 'home' | 'stop' | 'bus') => void;
}

const TransitContext = createContext<TransitContextValue | null>(null);

export function TransitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  // Load persisted routes after mount (avoids SSR/client hydration mismatch)
  useEffect(() => {
    const selectedRoutes = loadSet(SELECTED_ROUTES_KEY);
    const pinnedRoutes = loadSet(PINNED_ROUTES_KEY);
    if (selectedRoutes.size > 0 || pinnedRoutes.size > 0) {
      dispatch({ type: 'LOAD_PERSISTED', selectedRoutes, pinnedRoutes });
    }
  }, []);

  // Persist selected and pinned routes to localStorage
  useEffect(() => {
    saveSet(SELECTED_ROUTES_KEY, state.selectedRoutes);
  }, [state.selectedRoutes]);

  useEffect(() => {
    saveSet(PINNED_ROUTES_KEY, state.pinnedRoutes);
  }, [state.pinnedRoutes]);

  // Stable dispatch-bound action creators — never recreated
  const actions = useMemo(() => ({
    toggleRoute: (routeId: number) => dispatch({ type: 'TOGGLE_ROUTE', routeId }),
    selectAllRoutes: () => dispatch({ type: 'SELECT_ALL_ROUTES' }),
    togglePinnedRoute: (routeId: number) => dispatch({ type: 'TOGGLE_PINNED_ROUTE', routeId }),
    selectStop: (stopId: number, fromBusId?: string) => dispatch({ type: 'SELECT_STOP', stopId, fromBusId }),
    selectStopWithRouteFilter: (stopId: number, routeId: number) => dispatch({ type: 'SELECT_STOP_WITH_ROUTE_FILTER', stopId, routeId }),
    selectBus: (busId: string) => dispatch({ type: 'SELECT_BUS', busId }),
    selectBusFromStop: (busId: string, fromStopId: number) => dispatch({ type: 'SELECT_BUS_FROM_STOP', busId, fromStopId }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    panMap: (lat: number, lng: number, zoom?: number) => dispatch({ type: 'PAN_MAP', lat, lng, zoom }),
    clearMapTarget: () => dispatch({ type: 'CLEAR_MAP_TARGET' }),
    backToBus: () => dispatch({ type: 'BACK_TO_BUS' }),
    backToStop: () => dispatch({ type: 'BACK_TO_STOP' }),
    setDrawerView: (view: 'home' | 'stop' | 'bus') => dispatch({ type: 'SET_DRAWER_VIEW', view }),
  }), []); // dispatch is stable from useReducer

  const value = useMemo<TransitContextValue>(() => ({
    state,
    ...actions,
    isRouteVisible: (routeId: number) =>
      state.selectedRoutes.size === 0 || state.selectedRoutes.has(routeId),
  }), [state, actions]);

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
}

export function useTransit() {
  const ctx = useContext(TransitContext);
  if (!ctx) throw new Error('useTransit must be used inside TransitProvider');
  return ctx;
}

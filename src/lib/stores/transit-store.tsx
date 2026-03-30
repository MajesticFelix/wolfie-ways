'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';

interface TransitState {
  selectedRoutes: Set<number>;
  selectedStop: number | null;
  selectedBus: string | null;
  panelMode: 'stop' | 'bus' | null;
  mapTarget: { lat: number; lng: number; zoom?: number } | null;
  previousBus: string | null;   // set when navigating: bus → stop
  previousStop: number | null;  // set when navigating: stop → bus
}

type Action =
  | { type: 'TOGGLE_ROUTE'; routeId: number }
  | { type: 'SELECT_ALL_ROUTES' }
  | { type: 'SELECT_STOP'; stopId: number; fromBusId?: string }
  | { type: 'SELECT_BUS'; busId: string }
  | { type: 'SELECT_BUS_FROM_STOP'; busId: string; fromStopId: number }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'PAN_MAP'; lat: number; lng: number; zoom?: number }
  | { type: 'CLEAR_MAP_TARGET' }
  | { type: 'BACK_TO_BUS' }
  | { type: 'BACK_TO_STOP' };

function reducer(state: TransitState, action: Action): TransitState {
  switch (action.type) {
    case 'TOGGLE_ROUTE': {
      const next = new Set(state.selectedRoutes);
      if (next.has(action.routeId)) next.delete(action.routeId);
      else next.add(action.routeId);
      return { ...state, selectedRoutes: next };
    }
    case 'SELECT_ALL_ROUTES':
      return { ...state, selectedRoutes: new Set() };
    case 'SELECT_STOP':
      return {
        ...state,
        selectedStop: action.stopId,
        selectedBus: null,
        panelMode: 'stop',
        previousBus: action.fromBusId ?? null,
        previousStop: null,
      };
    case 'SELECT_BUS':
      return {
        ...state,
        selectedBus: action.busId,
        selectedStop: null,
        panelMode: 'bus',
        previousBus: null,
        previousStop: null,
      };
    case 'SELECT_BUS_FROM_STOP':
      return {
        ...state,
        selectedBus: action.busId,
        selectedStop: null,
        panelMode: 'bus',
        previousBus: null,
        previousStop: action.fromStopId,
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedStop: null,
        selectedBus: null,
        panelMode: null,
        previousBus: null,
        previousStop: null,
      };
    case 'BACK_TO_BUS':
      if (!state.previousBus) return state;
      return {
        ...state,
        selectedBus: state.previousBus,
        selectedStop: null,
        panelMode: 'bus',
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
        previousStop: null,
        previousBus: null,
      };
    case 'PAN_MAP':
      return { ...state, mapTarget: { lat: action.lat, lng: action.lng, zoom: action.zoom } };
    case 'CLEAR_MAP_TARGET':
      return { ...state, mapTarget: null };
    default:
      return state;
  }
}

const initialState: TransitState = {
  selectedRoutes: new Set(),
  selectedStop: null,
  selectedBus: null,
  panelMode: null,
  mapTarget: null,
  previousBus: null,
  previousStop: null,
};

interface TransitContextValue {
  state: TransitState;
  toggleRoute: (routeId: number) => void;
  selectAllRoutes: () => void;
  selectStop: (stopId: number, fromBusId?: string) => void;
  selectBus: (busId: string) => void;
  selectBusFromStop: (busId: string, fromStopId: number) => void;
  clearSelection: () => void;
  isRouteVisible: (routeId: number) => boolean;
  panMap: (lat: number, lng: number, zoom?: number) => void;
  clearMapTarget: () => void;
  backToBus: () => void;
  backToStop: () => void;
}

const TransitContext = createContext<TransitContextValue | null>(null);

export function TransitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value: TransitContextValue = {
    state,
    toggleRoute: (routeId) => dispatch({ type: 'TOGGLE_ROUTE', routeId }),
    selectAllRoutes: () => dispatch({ type: 'SELECT_ALL_ROUTES' }),
    selectStop: (stopId, fromBusId) => dispatch({ type: 'SELECT_STOP', stopId, fromBusId }),
    selectBus: (busId) => dispatch({ type: 'SELECT_BUS', busId }),
    selectBusFromStop: (busId, fromStopId) =>
      dispatch({ type: 'SELECT_BUS_FROM_STOP', busId, fromStopId }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    isRouteVisible: (routeId) =>
      state.selectedRoutes.size === 0 || state.selectedRoutes.has(routeId),
    panMap: (lat, lng, zoom) => dispatch({ type: 'PAN_MAP', lat, lng, zoom }),
    clearMapTarget: () => dispatch({ type: 'CLEAR_MAP_TARGET' }),
    backToBus: () => dispatch({ type: 'BACK_TO_BUS' }),
    backToStop: () => dispatch({ type: 'BACK_TO_STOP' }),
  };

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
}

export function useTransit() {
  const ctx = useContext(TransitContext);
  if (!ctx) throw new Error('useTransit must be used inside TransitProvider');
  return ctx;
}

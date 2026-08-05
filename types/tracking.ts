/**
 * Tracking Types
 * TypeScript interfaces for route tracking, coordinates, and map markers
 */

/**
 * Geographic coordinate (latitude, longitude)
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Route waypoint with metadata
 */
export interface RouteWaypoint {
  coordinate: Coordinate;
  label?: string;
  type: 'origin' | 'destination' | 'checkpoint';
  timestamp?: string;
  address?: string;
}

/**
 * Complete route information
 */
export interface RouteData {
  deliveryId: string;
  origin: Coordinate;
  destination: Coordinate;
  waypoints: RouteWaypoint[];
  distance?: number; // in kilometers
  estimatedTime?: number; // in minutes
  currentLocation?: Coordinate;
  status: 'pending' | 'in_transit' | 'delivered';
  timestamp: string;
}

/**
 * API response for route data
 */
export interface RouteResponse {
  success: true;
  data: RouteData;
}

/**
 * API error response
 */
export interface RouteError {
  success: false;
  error: string;
}

/**
 * Union type for API responses
 */
export type RouteResult = RouteResponse | RouteError;

/**
 * Map bounds configuration
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Marker information for map display
 */
export interface MapMarker {
  id: string;
  coordinate: Coordinate;
  label: string;
  type: 'origin' | 'destination' | 'current';
  color?: string;
}

/**
 * Polyline path for route visualization
 */
export interface PolylinePath {
  coordinates: Coordinate[];
  color?: string;
  weight?: number;
  opacity?: number;
}

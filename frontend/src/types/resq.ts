export type RoadStatus = 'open' | 'restricted' | 'blocked' | 'unknown';
export type VehicleAccess = 'open' | 'restricted' | 'blocked';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type IncidentType =
  | 'landslide'
  | 'flood'
  | 'bridge_damage'
  | 'fallen_tree'
  | 'road_damage'
  | 'accident'
  | 'traffic_blockage'
  | 'heavy_rainfall'
  | 'other';

export type UserRole = 'driver' | 'field_officer' | 'district_officer';
export type NetworkState = 'online' | 'weak_2g' | 'offline';
export type SyncStatus = 'saved_locally' | 'waiting_network' | 'sent' | 'photo_pending' | 'under_review' | 'verified' | 'rejected';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'needs_field_check' | 'officer_override';

export interface RoadSegment {
  segment_id: string;
  segment_name: string;
  start_location: string;
  end_location: string;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  road_type: string;
  length_km: number;
  terrain_type: string;
  slope_category: string;
  bridge_present: boolean;
  road_status: RoadStatus;
  risk_level: RiskLevel;
  risk_score: number;
  truck_access: VehicleAccess;
  bus_access: VehicleAccess;
  motorcycle_access: VehicleAccess;
  emergency_vehicle_access: VehicleAccess;
  last_updated_utc: string;
  data_source: 'osm_reference' | 'synthetic_demo' | 'field_report_demo' | 'officer_verified_demo';
  confidence_score: number;
  notes: string;
  coordinates?: [number, number][]; // [lat, lon]
}

export interface Incident {
  incident_id: string;
  segment_id: string;
  incident_type: IncidentType;
  latitude: number;
  longitude: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reported_at_utc: string;
  resolved_at_utc?: string;
  duration_hours?: number;
  vehicle_impact: string;
  description: string;
  photo_available: boolean;
  photo_url?: string;
  verification_status: VerificationStatus;
  reported_by_role: string;
  data_source: string;
}

export interface FieldReport {
  report_id: string;
  incident_id?: string;
  reporter_id: string;
  reporter_role: 'field_officer' | 'volunteer' | 'driver' | 'local_authority';
  segment_id: string;
  latitude: number;
  longitude: number;
  reported_at_local: string;
  reported_at_utc: string;
  gps_accuracy_meters: number;
  incident_type: IncidentType;
  road_status_reported: RoadStatus;
  truck_access_reported: VehicleAccess;
  motorcycle_access_reported: VehicleAccess;
  bus_access_reported: VehicleAccess;
  emergency_access_reported: VehicleAccess;
  severity: 'low' | 'medium' | 'high' | 'critical';
  photo_attached: boolean;
  photo_url?: string;
  description: string;
  network_status_at_submission: NetworkState;
  sync_status: SyncStatus;
  submitted_to_server_at_utc?: string;
  verification_status: VerificationStatus;
  reviewed_by?: string;
  review_notes?: string;
  data_source: string;
}

export interface Vehicle {
  vehicle_id: string;
  vehicle_type: 'medical_supply_truck' | 'relief_pickup_truck' | 'motorcycle_courier';
  driver_name: string;
  driver_phone_masked: string;
  mission_id: string;
  origin: string;
  destination: string;
  current_segment_id: string;
  latitude: number;
  longitude: number;
  heading_degrees: number;
  speed_kmh: number;
  last_seen_utc: string;
  network_status: NetworkState;
  mission_status: 'assigned' | 'in_transit' | 'rerouted' | 'staged' | 'delivered';
  cargo_type: string;
  cargo_priority: 'critical' | 'high' | 'medium' | 'low';
  battery_percent: number;
  data_source: string;
}

export interface Mission {
  mission_id: string;
  cargo_type: string;
  cargo_description: string;
  cargo_priority: 'critical' | 'high' | 'medium' | 'low';
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lon: number;
  destination_lat: number;
  destination_lon: number;
  vehicle_id: string;
  planned_route: string;
  current_route: string;
  mission_created_at_utc: string;
  planned_eta_utc: string;
  current_eta_utc: string;
  mission_status: 'in_transit' | 'delayed' | 'rerouted' | 'staged' | 'delivered';
  delay_minutes: number;
  risk_level: RiskLevel;
  last_action: string;
  data_source: string;
}

export interface SafeHub {
  hub_id: string;
  hub_name: string;
  latitude: number;
  longitude: number;
  near_segment_id: string;
  capacity_vehicle_count: number;
  supports_cargo_transfer: boolean;
  has_mobile_signal: boolean;
  has_fuel: boolean;
  has_shelter: boolean;
  contact_role: string;
  status: string;
  data_source: string;
}

export interface HealthFacility {
  facility_id: string;
  facility_name: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  road_access_status: RoadStatus;
  emergency_supply_priority: string;
  cold_storage_available: boolean;
  near_segment_id: string;
  data_source: string;
}

export interface DecisionEvent {
  event_id: string;
  mission_id: string;
  event_type: string;
  actor_role: string;
  event_description: string;
  timestamp: string;
  event_data?: string;
}

export interface RiskEvaluationResult {
  overall_risk_score: number;
  risk_level: RiskLevel;
  confidence_score: number;
  human_review_required: boolean;
  explanation: string;
  weights: {
    rainfall_weight: number;
    terrain_weight: number;
    history_weight: number;
    field_report_weight: number;
    road_condition_weight: number;
  };
  component_scores: {
    rainfall_risk: number;
    terrain_risk: number;
    incident_history_risk: number;
    field_report_risk: number;
    road_condition_risk: number;
  };
}

export interface EvaluatedRoute {
  route_id: string;
  name: string;
  segments: string[];
  distance_km: number;
  eta_minutes: number;
  additional_delay_minutes: number;
  status: 'viable' | 'restricted' | 'rejected' | 'high_risk';
  is_blocked: boolean;
  avg_risk: number;
  max_risk: number;
  recommendation_note: string;
  description: string;
}

export interface RouteEvaluationResult {
  routes: EvaluatedRoute[];
  recommended_route_id: string | null;
  recommended_route: EvaluatedRoute | null;
  no_safe_route: boolean;
  fallback_protocol?: {
    status: string;
    message: string;
    recommended_actions: string[];
    safe_hub_target: string;
    alternative_transport: string;
  } | null;
}

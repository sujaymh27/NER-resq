from typing import Optional, List
from pydantic import BaseModel, Field

class RoadSegment(BaseModel):
    segment_id: str
    segment_name: str
    start_location: str
    end_location: str
    start_lat: float
    start_lon: float
    end_lat: float
    end_lon: float
    road_type: str = "national_highway"
    length_km: float
    terrain_type: str
    slope_category: str
    bridge_present: bool = False
    road_status: str = "open"  # open, restricted, blocked, unknown
    risk_level: str = "low"    # low, moderate, high, critical
    risk_score: int = 20
    truck_access: str = "open"  # open, restricted, blocked
    bus_access: str = "open"
    motorcycle_access: str = "open"
    emergency_vehicle_access: str = "open"
    last_updated_utc: str
    data_source: str = "synthetic_demo"
    confidence_score: int = 90
    notes: Optional[str] = None

class Incident(BaseModel):
    incident_id: str
    segment_id: str
    incident_type: str  # landslide, flood, bridge_damage, fallen_tree, road_damage, accident, traffic_blockage, heavy_rainfall, other
    latitude: float
    longitude: float
    severity: str  # low, medium, high, critical
    reported_at_utc: str
    resolved_at_utc: Optional[str] = None
    duration_hours: Optional[float] = None
    vehicle_impact: str
    description: str
    photo_available: bool = False
    verification_status: str = "pending"  # pending, verified, rejected, needs_field_check
    reported_by_role: str = "field_officer"
    data_source: str = "synthetic_demo"

class FieldReport(BaseModel):
    report_id: str
    incident_id: Optional[str] = None
    reporter_id: str = "FO-021"
    reporter_role: str = "field_officer"
    segment_id: str
    latitude: float
    longitude: float
    reported_at_local: str
    reported_at_utc: str
    gps_accuracy_meters: float
    incident_type: str
    road_status_reported: str
    truck_access_reported: str
    motorcycle_access_reported: str
    bus_access_reported: str = "open"
    emergency_access_reported: str = "restricted"
    severity: str
    photo_attached: bool = False
    photo_data_url: Optional[str] = None
    description: str
    network_status_at_submission: str = "offline"
    sync_status: str = "saved_locally"  # saved_locally, queued, synced, photo_pending, failed_retry
    submitted_to_server_at_utc: Optional[str] = None
    verification_status: str = "pending"  # pending, verified, rejected, needs_field_check
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    data_source: str = "field_report_demo"

class Vehicle(BaseModel):
    vehicle_id: str
    vehicle_type: str  # medical_supply_truck, relief_pickup_truck, motorcycle_courier
    driver_name: str
    driver_phone_masked: str
    mission_id: str
    origin: str
    destination: str
    current_segment_id: str
    latitude: float
    longitude: float
    heading_degrees: int
    speed_kmh: int
    last_seen_utc: str
    network_status: str
    mission_status: str  # assigned, in_transit, rerouted, staged, delivered
    cargo_type: str
    cargo_priority: str
    battery_percent: int
    data_source: str = "synthetic_demo"

class Mission(BaseModel):
    mission_id: str
    cargo_type: str
    cargo_description: str
    cargo_priority: str  # critical, high, medium, low
    origin: str
    destination: str
    origin_lat: float
    origin_lon: float
    destination_lat: float
    destination_lon: float
    vehicle_id: str
    planned_route: str
    current_route: str
    mission_created_at_utc: str
    planned_eta_utc: str
    current_eta_utc: str
    mission_status: str  # in_transit, delayed, rerouted, staged, delivered
    delay_minutes: int = 0
    risk_level: str = "low"
    last_action: str
    data_source: str = "synthetic_demo"

class RiskScore(BaseModel):
    risk_record_id: str
    segment_id: str
    calculated_at_utc: str
    rainfall_risk_score: float
    terrain_risk_score: float
    history_risk_score: float
    field_report_risk_score: float
    road_condition_score: float
    data_freshness_score: float = 90.0
    overall_risk_score: int
    risk_level: str
    confidence_score: int
    explanation: str
    model_version: str = "v1.2-weighted-explainable"
    human_review_required: bool = False
    data_source: str = "synthetic_demo"

class DecisionEvent(BaseModel):
    event_id: str
    mission_id: str
    event_type: str
    actor_role: str
    event_description: str
    timestamp: str
    event_data: Optional[str] = "{}"

class SafeHub(BaseModel):
    hub_id: str
    hub_name: str
    latitude: float
    longitude: float
    near_segment_id: str
    capacity_vehicle_count: int
    supports_cargo_transfer: bool = True
    has_mobile_signal: bool = True
    has_fuel: bool = True
    has_shelter: bool = True
    contact_role: str
    status: str = "active"
    data_source: str = "synthetic_demo"

class HealthFacility(BaseModel):
    facility_id: str
    facility_name: str
    facility_type: str
    latitude: float
    longitude: float
    road_access_status: str
    emergency_supply_priority: str
    cold_storage_available: bool
    near_segment_id: str
    data_source: str = "synthetic_demo"

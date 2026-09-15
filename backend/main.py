import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import db
from .models import FieldReport, Incident, RoadSegment, DecisionEvent
from .risk_engine import compute_explainable_risk
from .route_engine import evaluate_corridor_routes

app = FastAPI(
    title="NER ResQ Emergency Routing API",
    description="Pilot Corridor: Shillong → Sohra, Meghalaya, India",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {
        "service": "NER ResQ API",
        "pilot_corridor": "Shillong → Sohra, Meghalaya, India",
        "status": "operational",
        "data_notice": "Demonstration data (synthetic_demo / field_report_demo / officer_verified_demo)"
    }

# Segments
@app.get("/api/segments")
def get_segments():
    return list(db.segments.values())

@app.get("/api/segments/{segment_id}")
def get_segment(segment_id: str):
    if segment_id not in db.segments:
        raise HTTPException(status_code=404, detail=f"Segment {segment_id} not found")
    return db.segments[segment_id]

class SegmentStatusUpdate(BaseModel):
    road_status: Optional[str] = None
    truck_access: Optional[str] = None
    motorcycle_access: Optional[str] = None
    bus_access: Optional[str] = None
    risk_score: Optional[int] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None
    actor_role: str = "district_officer"

@app.patch("/api/segments/{segment_id}/status")
def update_segment_status(segment_id: str, update: SegmentStatusUpdate):
    if segment_id not in db.segments:
        raise HTTPException(status_code=404, detail="Segment not found")
    seg = db.segments[segment_id]
    if update.road_status:
        seg["road_status"] = update.road_status
    if update.truck_access:
        seg["truck_access"] = update.truck_access
    if update.motorcycle_access:
        seg["motorcycle_access"] = update.motorcycle_access
    if update.bus_access:
        seg["bus_access"] = update.bus_access
    if update.risk_score is not None:
        seg["risk_score"] = update.risk_score
    if update.risk_level:
        seg["risk_level"] = update.risk_level
    if update.notes:
        seg["notes"] = update.notes
    seg["last_updated_utc"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    seg["data_source"] = "officer_verified_demo"

    db.log_event(
        mission_id="M-001",
        event_type="SEGMENT_STATUS_UPDATED",
        actor_role=update.actor_role,
        description=f"Road segment {segment_id} updated to {seg['road_status']} (Truck: {seg['truck_access']})",
        data={"segment_id": segment_id, "status": seg["road_status"], "truck_access": seg["truck_access"]}
    )
    return seg

# Incidents
@app.get("/api/incidents")
def get_incidents():
    return list(db.incidents.values())

@app.post("/api/incidents")
def create_incident(incident: Incident):
    db.incidents[incident.incident_id] = incident.model_dump()
    return incident

# Field Reports
@app.get("/api/field-reports")
def get_field_reports():
    return list(db.field_reports.values())

class NewFieldReport(BaseModel):
    report_id: Optional[str] = None
    reporter_id: str = "FO-021"
    reporter_role: str = "field_officer"
    segment_id: str
    latitude: float
    longitude: float
    gps_accuracy_meters: float = 10.0
    incident_type: str
    road_status_reported: str
    truck_access_reported: str
    motorcycle_access_reported: str
    bus_access_reported: str = "open"
    emergency_access_reported: str = "restricted"
    severity: str = "high"
    photo_attached: bool = False
    photo_data_url: Optional[str] = None
    description: str
    network_status_at_submission: str = "offline"
    sync_status: str = "saved_locally"

@app.post("/api/field-reports")
def submit_field_report(report: NewFieldReport):
    rep_id = report.report_id or f"FR-{len(db.field_reports)+1:03d}"
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    now_local = datetime.now().isoformat()

    rep_dict = {
        "report_id": rep_id,
        "incident_id": f"INC-NEW-{len(db.field_reports)+1}",
        "reporter_id": report.reporter_id,
        "reporter_role": report.reporter_role,
        "segment_id": report.segment_id,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "reported_at_local": now_local,
        "reported_at_utc": now_utc,
        "gps_accuracy_meters": report.gps_accuracy_meters,
        "incident_type": report.incident_type,
        "road_status_reported": report.road_status_reported,
        "truck_access_reported": report.truck_access_reported,
        "motorcycle_access_reported": report.motorcycle_access_reported,
        "bus_access_reported": report.bus_access_reported,
        "emergency_access_reported": report.emergency_access_reported,
        "severity": report.severity,
        "photo_attached": report.photo_attached,
        "photo_data_url": report.photo_data_url,
        "description": report.description,
        "network_status_at_submission": report.network_status_at_submission,
        "sync_status": report.sync_status,
        "submitted_to_server_at_utc": now_utc if report.sync_status == "synced" else None,
        "verification_status": "pending",
        "reviewed_by": None,
        "review_notes": None,
        "data_source": "field_report_demo"
    }
    db.field_reports[rep_id] = rep_dict

    db.log_event(
        mission_id="M-001",
        event_type="FIELD_REPORT_SUBMITTED",
        actor_role=report.reporter_role,
        description=f"Field report {rep_id} submitted for {report.segment_id}: {report.incident_type} ({report.sync_status})",
        data={"report_id": rep_id, "segment": report.segment_id, "sync_status": report.sync_status}
    )
    return rep_dict

class VerifyReportRequest(BaseModel):
    action: str  # verify, reject, request_field_check, override
    reviewed_by: str = "District Officer Demo"
    review_notes: str
    apply_to_road: bool = True

@app.post("/api/field-reports/{report_id}/verify")
def verify_field_report(report_id: str, req: VerifyReportRequest):
    if report_id not in db.field_reports:
        raise HTTPException(status_code=404, detail="Field report not found")
    report = db.field_reports[report_id]
    
    if req.action == "verify":
        report["verification_status"] = "verified"
    elif req.action == "reject":
        report["verification_status"] = "rejected"
    elif req.action == "request_field_check":
        report["verification_status"] = "needs_field_check"
    elif req.action == "override":
        report["verification_status"] = "officer_override"

    report["reviewed_by"] = req.reviewed_by
    report["review_notes"] = req.review_notes

    # If verifying and apply_to_road is true, update the road segment
    seg_id = report["segment_id"]
    if req.action == "verify" and req.apply_to_road and seg_id in db.segments:
        seg = db.segments[seg_id]
        seg["road_status"] = report["road_status_reported"]
        seg["truck_access"] = report["truck_access_reported"]
        seg["motorcycle_access"] = report["motorcycle_access_reported"]
        seg["bus_access"] = report["bus_access_reported"]
        seg["risk_level"] = "critical" if report["severity"] == "critical" else "high"
        seg["risk_score"] = 86 if report["severity"] == "critical" else 72
        seg["data_source"] = "officer_verified_demo"
        seg["last_updated_utc"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

        # Also add to active incidents if not exists
        inc_id = f"INC-ACT-{seg_id}"
        db.incidents[inc_id] = {
            "incident_id": inc_id,
            "segment_id": seg_id,
            "incident_type": report["incident_type"],
            "latitude": report["latitude"],
            "longitude": report["longitude"],
            "severity": report["severity"],
            "reported_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "vehicle_impact": "trucks_blocked_motorcycles_open",
            "description": report["description"],
            "photo_available": report["photo_attached"],
            "verification_status": "verified",
            "reported_by_role": "district_officer",
            "data_source": "officer_verified_demo"
        }

    db.log_event(
        mission_id="M-001",
        event_type="REPORT_VERIFIED" if req.action == "verify" else "REPORT_REVIEWED",
        actor_role="district_officer",
        description=f"District Officer action '{req.action}' on report {report_id} ({seg_id})",
        data={"report_id": report_id, "action": req.action, "notes": req.review_notes}
    )
    return report

# Vehicles & Missions
@app.get("/api/vehicles")
def get_vehicles():
    return list(db.vehicles.values())

@app.get("/api/missions")
def get_missions():
    return list(db.missions.values())

class MissionRerouteRequest(BaseModel):
    new_route: str
    delay_minutes: int
    alert_text: str

@app.post("/api/missions/{mission_id}/reroute")
def reroute_mission(mission_id: str, req: MissionRerouteRequest):
    if mission_id not in db.missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission = db.missions[mission_id]
    mission["current_route"] = req.new_route
    mission["delay_minutes"] = req.delay_minutes
    mission["mission_status"] = "rerouted"
    mission["last_action"] = f"Rerouted to {req.new_route}. Alert issued: {req.alert_text}"
    
    # Update vehicle status
    veh_id = mission["vehicle_id"]
    if veh_id in db.vehicles:
        db.vehicles[veh_id]["mission_status"] = "rerouted"

    db.log_event(
        mission_id=mission_id,
        event_type="MISSION_REROUTED",
        actor_role="district_officer",
        description=f"Mission {mission_id} rerouted to {req.new_route} (+{req.delay_minutes} min delay)",
        data={"route": req.new_route, "delay": req.delay_minutes, "alert": req.alert_text}
    )
    return mission

# Driver actions
class DriverAckRequest(BaseModel):
    vehicle_id: str
    mission_id: str

@app.post("/api/driver/acknowledge")
def acknowledge_alert(req: DriverAckRequest):
    if req.mission_id in db.missions:
        db.missions[req.mission_id]["last_action"] = "Driver acknowledged reroute alert. Following Route B."
    
    db.log_event(
        mission_id=req.mission_id,
        event_type="DRIVER_ALERT_ACKNOWLEDGED",
        actor_role="driver",
        description=f"Driver for {req.vehicle_id} acknowledged reroute alert",
        data={"vehicle_id": req.vehicle_id}
    )
    return {"status": "acknowledged", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.post("/api/driver/complete-mission")
def complete_mission(req: DriverAckRequest):
    if req.mission_id in db.missions:
        m = db.missions[req.mission_id]
        m["mission_status"] = "delivered"
        m["last_action"] = "Mission completed successfully at destination health facility."
    if req.vehicle_id in db.vehicles:
        v = db.vehicles[req.vehicle_id]
        v["mission_status"] = "delivered"
        v["current_segment_id"] = "R-005"
        v["latitude"] = 25.2913
        v["longitude"] = 91.7210
        v["speed_kmh"] = 0

    db.log_event(
        mission_id=req.mission_id,
        event_type="MISSION_COMPLETED",
        actor_role="driver",
        description=f"Delivery completed: Medicine arrived at Sohra Health Facility",
        data={"vehicle_id": req.vehicle_id}
    )
    return {"status": "delivered", "mission_id": req.mission_id}

# Risk and Route engines
class EvaluateRiskRequest(BaseModel):
    rainfall_risk: float
    terrain_risk: float
    incident_history_risk: float
    field_report_risk: float
    road_condition_risk: float
    data_freshness: float = 90.0

@app.post("/api/risk/evaluate")
def evaluate_risk(req: EvaluateRiskRequest):
    return compute_explainable_risk(
        rainfall_risk=req.rainfall_risk,
        terrain_risk=req.terrain_risk,
        incident_history_risk=req.incident_history_risk,
        field_report_risk=req.field_report_risk,
        road_condition_risk=req.road_condition_risk,
        data_freshness=req.data_freshness
    )

class EvaluateRouteRequest(BaseModel):
    vehicle_type: str = "medical_supply_truck"
    mission_priority: str = "critical"

@app.post("/api/routes/evaluate")
def evaluate_routes(req: EvaluateRouteRequest):
    return evaluate_corridor_routes(
        vehicle_type=req.vehicle_type,
        segment_statuses=db.segments,
        mission_priority=req.mission_priority
    )

# Safe hubs, health facilities, events
@app.get("/api/safe-hubs")
def get_safe_hubs():
    return list(db.safe_hubs.values())

@app.get("/api/health-facilities")
def get_health_facilities():
    return list(db.health_facilities.values())

@app.get("/api/decision-events")
def get_decision_events():
    return sorted(db.decision_events, key=lambda x: x["timestamp"], reverse=True)

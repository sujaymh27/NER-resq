import os
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from .database import db
    from .models import (
        FieldReport, Incident, RoadSegment, DecisionEvent, Mission,
        CreateMissionRequest, UpdateLocationRequest, SendAlertRequest,
        RerouteMissionRequest, EscalateMissionRequest
    )
    from .risk_engine import compute_explainable_risk
    from .route_engine import evaluate_corridor_routes
except (ImportError, ValueError):
    from database import db
    from models import (
        FieldReport, Incident, RoadSegment, DecisionEvent, Mission,
        CreateMissionRequest, UpdateLocationRequest, SendAlertRequest,
        RerouteMissionRequest, EscalateMissionRequest
    )
    from risk_engine import compute_explainable_risk
    from route_engine import evaluate_corridor_routes

app = FastAPI(
    title="NER ResQ Emergency Routing API",
    description="Pilot Corridor: Shillong → Sohra, Meghalaya, India",
    version="1.0.0"
)

# Enable CORS for Next.js frontend (local dev and Vercel production)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    cors_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
else:
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins != ["*"] else ["*"],
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
@app.get("/vehicles")
def get_vehicles():
    return list(db.vehicles.values())

@app.get("/api/missions")
@app.get("/missions")
def get_missions():
    return list(db.missions.values())

@app.get("/api/missions/active")
@app.get("/missions/active")
def get_active_missions():
    # Return missions that are started, in transit, paused, at risk, or rerouted
    active = [m for m in db.missions.values() if m.get("mission_status") not in ["Delivered", "delivered"]]
    if active:
        return active
    # Fallback to the latest mission
    return list(db.missions.values())

@app.get("/api/missions/{mission_id}")
@app.get("/missions/{mission_id}")
def get_mission(mission_id: str):
    if mission_id not in db.missions:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} not found")
    return db.missions[mission_id]

@app.post("/api/missions")
@app.post("/missions")
def create_mission(req: CreateMissionRequest):
    new_id = f"M-{len(db.missions)+1:03d}"
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    is_route_b = "Route B" in req.assigned_route or "R-003-ALT" in req.assigned_route
    route_code = "R-001>R-002>R-003-ALT>R-005" if is_route_b else "R-001>R-002>R-003>R-004>R-005"
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")

    mission_data = {
        "mission_id": new_id,
        "driver_name": req.driver_name,
        "vehicle_number": req.vehicle_number,
        "vehicle_type": req.vehicle_type,
        "from_location": req.from_location,
        "origin": req.from_location,
        "destination": req.destination,
        "cargo_type": req.cargo_type,
        "cargo_description": req.cargo_type,
        "cargo_priority": req.cargo_priority,
        "origin_lat": 25.5600,
        "origin_lon": 91.8700,
        "destination_lat": 25.2913,
        "destination_lon": 91.7210,
        "vehicle_id": "V-001",
        "planned_route": route_code,
        "current_route": route_code,
        "mission_created_at_utc": now_utc,
        "planned_eta_utc": "2 hr 10 min",
        "current_eta_utc": "2 hr 10 min",
        "current_latitude": 25.5600,
        "current_longitude": 91.8700,
        "current_road_segment": "R-001",
        "distance_remaining_km": 54.0,
        "speed_kmh": 38,
        "mission_status": "In Transit",
        "risk_status": "Normal",
        "risk_level": "low",
        "delay_minutes": 0,
        "last_updated_utc": now_utc,
        "network_status": "online",
        "active_alert": None,
        "timeline": [
            {
                "timestamp": now_utc,
                "time_label": time_label,
                "description": f"Mission {new_id} started by {req.driver_name} ({req.vehicle_number}). Destination: {req.destination}.",
                "actor_role": "driver"
            }
        ],
        "last_action": f"Vehicle departed {req.from_location} on schedule.",
        "data_source": "live_connected_demo"
    }

    db.missions[new_id] = mission_data
    # Also update default active mission M-001 for compatibility
    db.missions["M-001"] = dict(mission_data, mission_id="M-001")

    # Update vehicle V-001
    if "V-001" in db.vehicles:
        db.vehicles["V-001"].update({
            "driver_name": req.driver_name,
            "vehicle_number": req.vehicle_number,
            "mission_id": new_id,
            "origin": req.from_location,
            "destination": req.destination,
            "current_segment_id": "R-001",
            "latitude": 25.5600,
            "longitude": 91.8700,
            "speed_kmh": 38,
            "mission_status": "In Transit",
            "cargo_type": req.cargo_type,
            "cargo_priority": req.cargo_priority,
            "last_seen_utc": now_utc
        })

    db.log_event(
        mission_id=new_id,
        event_type="MISSION_STARTED",
        actor_role="driver",
        description=f"Driver {req.driver_name} started mission {new_id} ({req.cargo_type} for {req.destination})",
        data={"driver": req.driver_name, "vehicle": req.vehicle_number, "from": req.from_location, "to": req.destination}
    )
    return mission_data

@app.patch("/api/missions/{mission_id}")
@app.patch("/missions/{mission_id}")
def update_mission(mission_id: str, updates: Dict[str, Any]):
    if mission_id not in db.missions:
        raise HTTPException(status_code=404, detail="Mission not found")
    mission = db.missions[mission_id]
    mission.update(updates)
    mission["last_updated_utc"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return mission

@app.post("/api/missions/{mission_id}/location")
@app.post("/missions/{mission_id}/location")
def update_mission_location(mission_id: str, req: UpdateLocationRequest):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    
    target_id = mission_id if mission_id in db.missions else "M-001"
    if target_id in db.missions:
        m = db.missions[target_id]
        prev_seg = m.get("current_road_segment", "R-001")
        m["current_latitude"] = req.latitude
        m["current_longitude"] = req.longitude
        m["current_road_segment"] = req.current_segment_id
        m["speed_kmh"] = req.speed_kmh
        m["current_eta_utc"] = req.eta
        m["distance_remaining_km"] = req.distance_remaining_km
        m["last_updated_utc"] = now_utc
        if req.mission_status:
            m["mission_status"] = req.mission_status
        if req.network_status:
            m["network_status"] = req.network_status
        
        # Add timeline entry if sector changed
        if prev_seg != req.current_segment_id:
            m["timeline"].append({
                "timestamp": now_utc,
                "time_label": time_label,
                "description": f"Vehicle entered sector {req.current_segment_id}",
                "actor_role": "system"
            })

    # Update vehicle V-001
    veh_id = db.missions.get(target_id, {}).get("vehicle_id", "V-001")
    if veh_id in db.vehicles:
        db.vehicles[veh_id].update({
            "latitude": req.latitude,
            "longitude": req.longitude,
            "current_segment_id": req.current_segment_id,
            "speed_kmh": req.speed_kmh,
            "last_seen_utc": now_utc
        })
        if req.mission_status:
            db.vehicles[veh_id]["mission_status"] = req.mission_status

    return {"status": "updated", "mission_id": target_id, "timestamp": now_utc}

@app.post("/api/missions/{mission_id}/pause")
@app.post("/missions/{mission_id}/pause")
def pause_mission(mission_id: str):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"
    if target_id in db.missions:
        m = db.missions[target_id]
        m["mission_status"] = "Paused"
        m["speed_kmh"] = 0
        m["last_updated_utc"] = now_utc
        m["last_action"] = "Mission paused by driver."
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": "Mission paused by driver",
            "actor_role": "driver"
        })
    if "V-001" in db.vehicles:
        db.vehicles["V-001"]["mission_status"] = "Paused"
        db.vehicles["V-001"]["speed_kmh"] = 0
    
    db.log_event(mission_id=target_id, event_type="MISSION_PAUSED", actor_role="driver", description="Driver paused active mission")
    return {"status": "Paused", "mission_id": target_id}

@app.post("/api/missions/{mission_id}/resume")
@app.post("/missions/{mission_id}/resume")
def resume_mission(mission_id: str):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"
    if target_id in db.missions:
        m = db.missions[target_id]
        m["mission_status"] = "In Transit"
        m["speed_kmh"] = 38
        m["last_updated_utc"] = now_utc
        m["last_action"] = "Mission resumed by driver."
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": "Mission resumed by driver",
            "actor_role": "driver"
        })
    if "V-001" in db.vehicles:
        db.vehicles["V-001"]["mission_status"] = "In Transit"
        db.vehicles["V-001"]["speed_kmh"] = 38
    
    db.log_event(mission_id=target_id, event_type="MISSION_RESUMED", actor_role="driver", description="Driver resumed active mission")
    return {"status": "In Transit", "mission_id": target_id}

@app.post("/api/missions/{mission_id}/alert")
@app.post("/missions/{mission_id}/alert")
def send_mission_alert(mission_id: str, req: SendAlertRequest):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"

    alert_obj = {
        "title": req.title,
        "message": req.message,
        "road_name": req.road_name,
        "route_bypass": req.route_bypass,
        "delay_minutes": req.delay_minutes,
        "sent_at_utc": now_utc,
        "acknowledged": False,
        "acknowledged_at_utc": None
    }

    if target_id in db.missions:
        m = db.missions[target_id]
        m["active_alert"] = alert_obj
        m["last_updated_utc"] = now_utc
        m["last_action"] = f"Alert issued: {req.title}. {req.route_bypass}"
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": f"Road blockage alert sent: {req.title}",
            "actor_role": "district_officer"
        })

    db.log_event(
        mission_id=target_id,
        event_type="DRIVER_ALERT_DISPATCHED",
        actor_role="district_officer",
        description=f"District Officer dispatched alert: {req.title} ({req.route_bypass})",
        data={"alert": req.title, "delay": req.delay_minutes}
    )
    return {"status": "alert_sent", "alert": alert_obj, "mission_id": target_id}

@app.post("/api/missions/{mission_id}/alert/acknowledge")
@app.post("/missions/{mission_id}/alert/acknowledge")
def acknowledge_mission_alert(mission_id: str):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"

    if target_id in db.missions:
        m = db.missions[target_id]
        if m.get("active_alert"):
            m["active_alert"]["acknowledged"] = True
            m["active_alert"]["acknowledged_at_utc"] = now_utc
        m["last_updated_utc"] = now_utc
        m["last_action"] = "Driver acknowledged reroute alert. Following Route B."
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": "Driver acknowledged alert and confirmed bypass",
            "actor_role": "driver"
        })

    db.log_event(
        mission_id=target_id,
        event_type="DRIVER_ALERT_ACKNOWLEDGED",
        actor_role="driver",
        description=f"Driver acknowledged alert for mission {target_id}",
        data={"mission_id": target_id}
    )
    return {"status": "acknowledged", "mission_id": target_id, "timestamp": now_utc}

class RequestHelpRequest(BaseModel):
    driver_name: Optional[str] = "Demo Driver"
    vehicle_number: Optional[str] = "Truck TRUCK-01"
    reason: str = "Road Blocked Ahead / Need Route Guidance"
    segment_id: Optional[str] = "R-004"
    details: Optional[str] = None

@app.post("/api/missions/{mission_id}/request-help")
@app.post("/missions/{mission_id}/request-help")
def request_mission_help(mission_id: str, req: RequestHelpRequest):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"

    help_obj = {
        "active": True,
        "driver_name": req.driver_name,
        "vehicle_number": req.vehicle_number,
        "reason": req.reason,
        "segment_id": req.segment_id,
        "details": req.details,
        "requested_at_utc": now_utc,
        "resolved": False
    }

    if target_id in db.missions:
        m = db.missions[target_id]
        m["assistance_request"] = help_obj
        m["last_updated_utc"] = now_utc
        m["last_action"] = f"Driver requested urgent assistance: {req.reason}"
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": f"Driver requested help: {req.reason} on segment {req.segment_id}",
            "actor_role": "driver"
        })

    db.log_event(
        mission_id=target_id,
        event_type="DRIVER_ASSISTANCE_REQUESTED",
        actor_role="driver",
        description=f"Driver requested urgent assistance: {req.reason} ({req.segment_id})",
        data=help_obj
    )
    return {"status": "help_requested", "assistance_request": help_obj, "mission_id": target_id}


@app.post("/api/missions/{mission_id}/reroute")
@app.post("/missions/{mission_id}/reroute")
def reroute_mission(mission_id: str, req: RerouteMissionRequest):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"

    if target_id in db.missions:
        m = db.missions[target_id]
        m["current_route"] = req.new_route
        m["delay_minutes"] = req.delay_minutes
        m["mission_status"] = "Rerouted"
        m["last_updated_utc"] = now_utc
        m["last_action"] = f"Rerouted to {req.new_route} (+{req.delay_minutes} min delay)."
        m["active_alert"] = {
            "title": "ROAD BLOCKED AHEAD — 2 KM",
            "message": req.alert_text or "Massive landslide blocking main highway. Bypass via Route B.",
            "road_name": "R-004 Mawkdok to Sohra Approach",
            "route_bypass": "TAKE ROUTE B (VIA UMTYNGAR BYPASS)",
            "delay_minutes": req.delay_minutes,
            "sent_at_utc": now_utc,
            "acknowledged": False,
            "acknowledged_at_utc": None
        }
        if m.get("assistance_request"):
            m["assistance_request"]["resolved"] = True
            m["assistance_request"]["active"] = False

        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": f"Mission rerouted to {req.new_route} (+{req.delay_minutes} min delay)",
            "actor_role": "district_officer"
        })

    if "V-001" in db.vehicles:
        db.vehicles["V-001"]["mission_status"] = "Rerouted"
        db.vehicles["V-001"]["current_segment_id"] = "R-003-ALT"

    db.log_event(
        mission_id=target_id,
        event_type="MISSION_REROUTED",
        actor_role="district_officer",
        description=f"Mission {target_id} rerouted to {req.new_route}",
        data={"route": req.new_route, "delay": req.delay_minutes}
    )
    return db.missions.get(target_id, {})

@app.post("/api/missions/{mission_id}/escalate")
@app.post("/missions/{mission_id}/escalate")
def escalate_mission(mission_id: str, req: EscalateMissionRequest):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"

    if target_id in db.missions:
        m = db.missions[target_id]
        m["mission_status"] = "Escalated"
        m["risk_status"] = "Escalated"
        m["last_updated_utc"] = now_utc
        m["last_action"] = f"Mission ESCALATED by District Officer. Reason: {req.reason}"
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": f"Mission escalated to State DEOC: {req.reason}",
            "actor_role": "district_officer"
        })

    if "V-001" in db.vehicles:
        db.vehicles["V-001"]["mission_status"] = "Escalated"

    db.log_event(
        mission_id=target_id,
        event_type="MISSION_ESCALATED",
        actor_role="district_officer",
        description=f"Mission {target_id} escalated: {req.reason}",
        data={"reason": req.reason}
    )
    return {"status": "Escalated", "mission_id": target_id}

@app.post("/api/missions/{mission_id}/complete")
@app.post("/missions/{mission_id}/complete")
def complete_mission_delivery(mission_id: str):
    now_utc = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    time_label = datetime.now().strftime("%I:%M %p").lstrip("0")
    target_id = mission_id if mission_id in db.missions else "M-001"

    if target_id in db.missions:
        m = db.missions[target_id]
        m["mission_status"] = "Delivered"
        m["distance_remaining_km"] = 0.0
        m["current_eta_utc"] = "Delivered"
        m["speed_kmh"] = 0
        m["last_updated_utc"] = now_utc
        m["last_action"] = "Delivery completed safely at Sohra Health Facility."
        m["timeline"].append({
            "timestamp": now_utc,
            "time_label": time_label,
            "description": "Delivery completed: Emergency medicine received at Sohra Health Facility",
            "actor_role": "driver"
        })

    if "V-001" in db.vehicles:
        db.vehicles["V-001"].update({
            "mission_status": "Delivered",
            "current_segment_id": "R-005",
            "latitude": 25.2913,
            "longitude": 91.7210,
            "speed_kmh": 0,
            "last_seen_utc": now_utc
        })

    db.log_event(
        mission_id=target_id,
        event_type="MISSION_COMPLETED",
        actor_role="driver",
        description=f"Delivery completed: Medicine arrived at Sohra Health Facility",
        data={"mission_id": target_id}
    )
    return {"status": "Delivered", "mission_id": target_id}

# Backward compatibility driver endpoints
class DriverAckRequest(BaseModel):
    vehicle_id: str = "V-001"
    mission_id: str = "M-001"

@app.post("/api/driver/acknowledge")
def legacy_acknowledge_alert(req: DriverAckRequest):
    return acknowledge_mission_alert(req.mission_id)

@app.post("/api/driver/complete-mission")
def legacy_complete_mission(req: DriverAckRequest):
    return complete_mission_delivery(req.mission_id)

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

@app.get("/api/state/full")
def get_full_state():
    return {
        "segments": list(db.segments.values()),
        "missions": list(db.missions.values()),
        "vehicles": list(db.vehicles.values()),
        "field_reports": list(db.field_reports.values()),
        "incidents": list(db.incidents.values()),
        "decision_events": sorted(db.decision_events, key=lambda x: x["timestamp"], reverse=True)
    }


import os
import csv
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

class ResQDatabase:
    def __init__(self):
        self.segments: Dict[str, Dict[str, Any]] = {}
        self.incidents: Dict[str, Dict[str, Any]] = {}
        self.field_reports: Dict[str, Dict[str, Any]] = {}
        self.vehicles: Dict[str, Dict[str, Any]] = {}
        self.missions: Dict[str, Dict[str, Any]] = {}
        self.risk_scores: Dict[str, Dict[str, Any]] = {}
        self.safe_hubs: Dict[str, Dict[str, Any]] = {}
        self.health_facilities: Dict[str, Dict[str, Any]] = {}
        self.decision_events: List[Dict[str, Any]] = []
        self.weather: List[Dict[str, Any]] = []
        self.load_from_csv()

    def load_from_csv(self):
        # Road segments
        path = os.path.join(DATA_DIR, "road_segments.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["start_lat"] = float(row["start_lat"])
                    row["start_lon"] = float(row["start_lon"])
                    row["end_lat"] = float(row["end_lat"])
                    row["end_lon"] = float(row["end_lon"])
                    row["length_km"] = float(row["length_km"])
                    row["risk_score"] = int(row["risk_score"])
                    row["confidence_score"] = int(row["confidence_score"])
                    row["bridge_present"] = row["bridge_present"].lower() == "true"
                    self.segments[row["segment_id"]] = row

        # Incidents
        path = os.path.join(DATA_DIR, "incidents.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["latitude"] = float(row["latitude"])
                    row["longitude"] = float(row["longitude"])
                    row["photo_available"] = row.get("photo_available", "false").lower() == "true"
                    self.incidents[row["incident_id"]] = row

        # Field Reports
        path = os.path.join(DATA_DIR, "field_reports.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["latitude"] = float(row["latitude"])
                    row["longitude"] = float(row["longitude"])
                    row["gps_accuracy_meters"] = float(row["gps_accuracy_meters"])
                    row["photo_attached"] = row.get("photo_attached", "false").lower() == "true"
                    self.field_reports[row["report_id"]] = row

        # Vehicles
        path = os.path.join(DATA_DIR, "vehicles.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["latitude"] = float(row["latitude"])
                    row["longitude"] = float(row["longitude"])
                    row["heading_degrees"] = int(row.get("heading_degrees", 0))
                    row["speed_kmh"] = int(row.get("speed_kmh", 0))
                    row["battery_percent"] = int(row.get("battery_percent", 100))
                    self.vehicles[row["vehicle_id"]] = row

        # Missions
        path = os.path.join(DATA_DIR, "missions.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["origin_lat"] = float(row["origin_lat"])
                    row["origin_lon"] = float(row["origin_lon"])
                    row["destination_lat"] = float(row["destination_lat"])
                    row["destination_lon"] = float(row["destination_lon"])
                    row["delay_minutes"] = int(row.get("delay_minutes", 0))
                    self.missions[row["mission_id"]] = row

        # Risk Scores
        path = os.path.join(DATA_DIR, "risk_scores.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["rainfall_risk_score"] = float(row["rainfall_risk_score"])
                    row["terrain_risk_score"] = float(row["terrain_risk_score"])
                    row["history_risk_score"] = float(row["history_risk_score"])
                    row["field_report_risk_score"] = float(row["field_report_risk_score"])
                    row["road_condition_score"] = float(row["road_condition_score"])
                    row["overall_risk_score"] = int(row["overall_risk_score"])
                    row["confidence_score"] = int(row["confidence_score"])
                    row["human_review_required"] = row.get("human_review_required", "false").lower() == "true"
                    self.risk_scores[row["segment_id"]] = row

        # Safe Hubs
        path = os.path.join(DATA_DIR, "safe_hubs.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["latitude"] = float(row["latitude"])
                    row["longitude"] = float(row["longitude"])
                    row["capacity_vehicle_count"] = int(row["capacity_vehicle_count"])
                    row["supports_cargo_transfer"] = row.get("supports_cargo_transfer", "true").lower() == "true"
                    row["has_mobile_signal"] = row.get("has_mobile_signal", "true").lower() == "true"
                    row["has_fuel"] = row.get("has_fuel", "true").lower() == "true"
                    row["has_shelter"] = row.get("has_shelter", "true").lower() == "true"
                    self.safe_hubs[row["hub_id"]] = row

        # Health Facilities
        path = os.path.join(DATA_DIR, "health_facilities.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row["latitude"] = float(row["latitude"])
                    row["longitude"] = float(row["longitude"])
                    row["cold_storage_available"] = row.get("cold_storage_available", "true").lower() == "true"
                    self.health_facilities[row["facility_id"]] = row

        # Decision Events
        path = os.path.join(DATA_DIR, "decision_events.csv")
        if os.path.exists(path):
            with open(path, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    self.decision_events.append(row)

    def log_event(self, mission_id: str, event_type: str, actor_role: str, description: str, data: Optional[Dict] = None):
        evt = {
            "event_id": f"EVT-{len(self.decision_events)+1:03d}",
            "mission_id": mission_id,
            "event_type": event_type,
            "actor_role": actor_role,
            "event_description": description,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "event_data": json.dumps(data or {})
        }
        self.decision_events.append(evt)
        return evt

db = ResQDatabase()

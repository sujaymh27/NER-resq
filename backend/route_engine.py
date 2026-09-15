from typing import Dict, Any, List

def evaluate_corridor_routes(
    vehicle_type: str,
    segment_statuses: Dict[str, Dict[str, Any]],
    mission_priority: str = "critical"
) -> Dict[str, Any]:
    """
    Evaluates Route candidates for Shillong -> Sohra:
    Route A: Main Highway (R-001 -> R-002 -> R-003 -> R-004 -> R-005)
    Route B: Eastern Umtyngar Bypass (R-001 -> R-002 -> R-003-ALT -> R-005)
    Route C: Scenic Terrace Ridge (R-001 -> R-002 -> R-003-ALT [slow] -> R-005)

    Vehicle access compatibility check:
    If vehicle_type == 'medical_supply_truck':
       checks 'truck_access' on each segment
    If vehicle_type == 'motorcycle_courier':
       checks 'motorcycle_access' on each segment
    """
    # Route definitions
    candidates = [
        {
            "route_id": "Route A",
            "name": "Direct Mountain Highway (via Mawkdok Gorge)",
            "segments": ["R-001", "R-002", "R-003", "R-004", "R-005"],
            "base_distance_km": 54.1,
            "base_eta_minutes": 105,
            "additional_delay_minutes": 0,
            "description": "Shortest direct corridor along SH-5 / Sohra Highway."
        },
        {
            "route_id": "Route B",
            "name": "Umtyngar-Laitryngew Eastern Bypass",
            "segments": ["R-001", "R-002", "R-003-ALT", "R-005"],
            "base_distance_km": 60.6,
            "base_eta_minutes": 130,
            "additional_delay_minutes": 25,
            "description": "Gentler eastern hillside road bypassing Mawkdok escarpment. +25 min delay."
        },
        {
            "route_id": "Route C",
            "name": "Scenic Terrace Secondary Link",
            "segments": ["R-001", "R-002", "R-003", "R-003-ALT", "R-005"],
            "base_distance_km": 65.2,
            "base_eta_minutes": 145,
            "additional_delay_minutes": 40,
            "description": "Ridge traverse suitable as emergency reserve if bypass is strained."
        }
    ]

    evaluated_routes = []
    
    for c in candidates:
        is_blocked = False
        is_restricted = False
        blocked_reasons = []
        route_risk_scores = []

        for seg_id in c["segments"]:
            seg_info = segment_statuses.get(seg_id, {
                "road_status": "open",
                "truck_access": "open",
                "motorcycle_access": "open",
                "bus_access": "open",
                "risk_score": 20,
                "segment_name": seg_id
            })

            risk = seg_info.get("risk_score", 20)
            route_risk_scores.append(risk)

            # Check general road status
            if seg_info.get("road_status") == "blocked":
                is_blocked = True
                blocked_reasons.append(f"{seg_id} is completely blocked ({seg_info.get('segment_name', '')})")

            # Check vehicle-specific access
            if "truck" in vehicle_type.lower():
                access = seg_info.get("truck_access", "open")
                if access == "blocked":
                    is_blocked = True
                    blocked_reasons.append(f"{seg_id} is blocked for trucks")
                elif access == "restricted":
                    is_restricted = True
            elif "motorcycle" in vehicle_type.lower():
                access = seg_info.get("motorcycle_access", "open")
                if access == "blocked":
                    is_blocked = True
                    blocked_reasons.append(f"{seg_id} is blocked for motorcycles")
                elif access == "restricted":
                    is_restricted = True

        avg_risk = int(sum(route_risk_scores) / max(1, len(route_risk_scores)))
        max_risk = max(route_risk_scores) if route_risk_scores else 20

        # Suitability & Recommendation determination
        if is_blocked:
            status = "rejected"
            recommendation_note = "REJECTED: " + "; ".join(blocked_reasons)
        elif is_restricted:
            status = "restricted"
            recommendation_note = f"RESTRICTED: Caution advised. Max risk on segment: {max_risk}."
        elif avg_risk > 65:
            status = "high_risk"
            recommendation_note = f"HIGH RISK: Hazardous weather/terrain conditions (avg risk {avg_risk})."
        else:
            status = "viable"
            recommendation_note = f"VIABLE: Clear for {vehicle_type}. Avg risk {avg_risk}."

        evaluated_routes.append({
            "route_id": c["route_id"],
            "name": c["name"],
            "segments": c["segments"],
            "distance_km": c["base_distance_km"],
            "eta_minutes": c["base_eta_minutes"],
            "additional_delay_minutes": c["additional_delay_minutes"],
            "status": status,
            "is_blocked": is_blocked,
            "avg_risk": avg_risk,
            "max_risk": max_risk,
            "recommendation_note": recommendation_note,
            "description": c["description"]
        })

    # Pick the recommended route: viable routes with lowest max risk and lowest delay
    viable_routes = [r for r in evaluated_routes if r["status"] == "viable"]
    restricted_routes = [r for r in evaluated_routes if r["status"] == "restricted"]

    recommended_route = None
    no_safe_route = False

    if viable_routes:
        # Sort by avg risk then additional delay
        viable_routes.sort(key=lambda x: (x["max_risk"], x["additional_delay_minutes"]))
        recommended_route = viable_routes[0]
    elif restricted_routes:
        restricted_routes.sort(key=lambda x: (x["max_risk"], x["additional_delay_minutes"]))
        recommended_route = restricted_routes[0]
    else:
        no_safe_route = True

    fallback_protocol = None
    if no_safe_route:
        fallback_protocol = {
            "status": "NO_SAFE_ROUTE_AVAILABLE",
            "message": "NO SAFE ROUTE AVAILABLE for vehicle type. Mountain corridor severely blocked.",
            "recommended_actions": [
                "Stop at nearest Safe Hub (SH-001 Mawkdok Logistics Hub or SH-002 Upper Shillong Base).",
                "Hold vehicle V-001 in covered staging shelter.",
                "Perform cargo transfer: shift emergency medicine to motorcycle courier (V-003) for shoulder traverse.",
                "Notify District Officer and dispatch escort.",
                "Escalate corridor crisis alert to State Head Office."
            ],
            "safe_hub_target": "SH-001 (Mawkdok Emergency Logistics Hub)",
            "alternative_transport": "Motorcycle Relay / Foot Sherpa"
        }

    return {
        "routes": evaluated_routes,
        "recommended_route_id": recommended_route["route_id"] if recommended_route else None,
        "recommended_route": recommended_route,
        "no_safe_route": no_safe_route,
        "fallback_protocol": fallback_protocol
    }

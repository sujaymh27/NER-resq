from typing import Dict, Any

def compute_explainable_risk(
    rainfall_risk: float,
    terrain_risk: float,
    incident_history_risk: float,
    field_report_risk: float,
    road_condition_risk: float,
    data_freshness: float = 90.0
) -> Dict[str, Any]:
    """
    Explainable Weighted Risk Engine:
    overall_risk_score = 
      0.30 * rainfall_risk
    + 0.20 * terrain_risk
    + 0.20 * incident_history_risk
    + 0.20 * field_report_risk
    + 0.10 * road_condition_risk

    Risk levels:
    - 0–25: Low
    - 26–50: Moderate
    - 51–75: High
    - 76–100: Critical
    """
    raw_score = (
        0.30 * rainfall_risk
        + 0.20 * terrain_risk
        + 0.20 * incident_history_risk
        + 0.20 * field_report_risk
        + 0.10 * road_condition_risk
    )
    risk_score = int(round(raw_score))
    risk_score = max(0, min(100, risk_score))

    if risk_score <= 25:
        risk_level = "low"
    elif risk_score <= 50:
        risk_level = "moderate"
    elif risk_score <= 75:
        risk_level = "high"
    else:
        risk_level = "critical"

    # Confidence calculation: weighted by data freshness and input completeness
    confidence = int(round(min(98.0, 0.7 * data_freshness + 0.3 * (100.0 - abs(raw_score - 50) * 0.2))))

    # Human review flag: Critical risk, low confidence, or active field conflict
    human_review_required = (risk_score >= 51) or (field_report_risk >= 70) or (confidence < 70)

    # Explainable textual justification
    reasons = []
    if rainfall_risk >= 60:
        reasons.append(f"heavy rainfall intensity ({rainfall_risk:.0f}/100)")
    elif rainfall_risk >= 35:
        reasons.append("moderate precipitation")

    if terrain_risk >= 70:
        reasons.append(f"steep gorge / landslide-prone escarpment ({terrain_risk:.0f}/100)")
    
    if field_report_risk >= 70:
        reasons.append(f"critical ground-truth field report ({field_report_risk:.0f}/100)")
    elif field_report_risk >= 40:
        reasons.append("recent unverified field observation")

    if incident_history_risk >= 60:
        reasons.append("recurrent historical slide/washout hotspot")

    if road_condition_risk >= 60:
        reasons.append("compromised road shoulder or structural strain")

    if not reasons:
        reasons.append("favorable atmospheric and road surface conditions")

    explanation = f"Segment evaluated with {', '.join(reasons)}."
    if human_review_required:
        explanation += " District officer verification required before altering routing status."

    return {
        "overall_risk_score": risk_score,
        "risk_level": risk_level,
        "confidence_score": confidence,
        "human_review_required": human_review_required,
        "explanation": explanation,
        "weights": {
            "rainfall_weight": 0.30,
            "terrain_weight": 0.20,
            "history_weight": 0.20,
            "field_report_weight": 0.20,
            "road_condition_weight": 0.10,
        },
        "component_scores": {
            "rainfall_risk": rainfall_risk,
            "terrain_risk": terrain_risk,
            "incident_history_risk": incident_history_risk,
            "field_report_risk": field_report_risk,
            "road_condition_risk": road_condition_risk
        }
    }

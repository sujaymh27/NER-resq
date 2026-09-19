# NER ResQ: AI-Based Smart Logistics & Accessibility Intelligence Platform for the North Eastern Region (NER)

**Smart India Hackathon 2026 Problem Statement:** `SIH26002`  
**Organisation:** Ministry of Development of North Eastern Region (MDoNER)  
**Pilot Corridor:** Shillong → Sohra (Cherrapunji), East Khasi Hills, Meghalaya, India  
**Live Deployment:** [https://ner-resq.vercel.app](https://ner-resq.vercel.app)

> **Core Value Statement:**  
> *“NER ResQ converts fragmented weather, road, vehicle and field information into one verified, vehicle-specific logistics decision for safer essential deliveries.”*

NER ResQ is an emergency logistics resilience system developed for mountain corridors in the North Eastern Region of India. It addresses catastrophic route disruptions caused by monsoonal landslides, flash floods, gorge bridge damage, and rockfalls, ensuring life-saving deliveries (insulin, emergency antibiotics, cold-chain antivenom, relief rations) reach destination health centers even when primary mountain highways are compromised.

---

## ⚠️ DATA PROVENANCE & DEMONSTRATION DISCLAIMER
All data used in this MVP demonstration is strictly tagged according to the pilot corridor study-area protocol:

| Data Type | Provenance Tag | Operational Meaning |
|:---|:---|:---|
| **Road Base Geometry** | `osm_reference` | Approximate road centerlines derived from OpenStreetMap for the Shillong–Sohra corridor (SH-5 / Cherrapunjee Highway). |
| **Prototype Segments** | `synthetic_demo` | Logical prototype segment IDs (`R-001` through `R-005`, `R-003-ALT`). **Not official government road IDs.** |
| **Incidents & Hazards** | `synthetic_demo` | Synthetic demonstration records of landslides, washed shoulders, rainfall cells, and bridge joint vibrations. |
| **Field Reports** | `field_report_demo` | Ground-truth simulation reports with offline sync states, GPS uncertainty radii, and vehicle access matrices. |
| **Officer Decisions** | `officer_verified_demo` | Simulated district officer verification stamps, road status overrides, and reroute approvals. |
| **Vehicle Tracking & GPS** | `synthetic_demo` | Synthetic GPS positions and heading telemetry along the pilot corridor. |
| **Facilities & Staging Hubs**| `synthetic_demo` | Prototype labels (`Sohra Community Health Facility`, `Mawkdok Emergency Logistics Hub`). Not official claims. |

---

## Core System Principles

1. **AI Predicts and Recommends; Human Verifies**:
   - The AI Risk Engine computes an explainable weighted risk score:
     $$\text{Risk Score} = 0.30 \times \text{Rainfall} + 0.20 \times \text{Terrain} + 0.20 \times \text{Incident History} + 0.20 \times \text{Field Reports} + 0.10 \times \text{Road Condition}$$
   - The AI **never silently blocks roads**. A District Officer must review evidence, inspect photos, and verify critical ground-truth reports.

2. **Ground Truth from Field Officers & Volunteers**:
   - Field personnel in remote gorge zones operate in offline-first mode, capturing road conditions, GPS accuracy, and 4-way vehicle access (Truck, Bus, Motorcycle, Emergency).
   - Reports are stored in local SQLite / IndexedDB queues and automatically synchronize when connectivity returns.

3. **Vehicle-Specific Routing**:
   - A landslide may block heavy supply trucks while narrow motorcycle couriers or emergency light vehicles can still pass via the outer shoulder. The routing engine generates vehicle-tailored routes.

4. **No-Forced-Danger / Safe-Hub Cargo Staging**:
   - If all road corridors are blocked for heavy vehicles, the system **never forces a dangerous mountain crossing**. It triggers the Safe-Hub Cargo Staging Protocol: holding the truck at an emergency shelter (e.g., Mawkdok Hub) and staging cargo transfer to motorcycle couriers or alerting the State Head Office.

5. **Driver Simplicity**:
   - The Driver mobile interface displays only what is operationally critical: Origin, Destination, Cargo, Route, Live ETA, high-contrast Red Alert warnings, an **[Acknowledge]** button, and a **[Call Control Room]** button.

---

## Four Role-Based Experiences

| Role | Interface Type | Primary Capabilities |
|:---|:---|:---|
| **Driver** | High-Contrast Mobile Screen | Simple navigation cues, ETA, remaining distance, red road blockage alert, 1-click acknowledgement, call control room, delivery completion. |
| **Field Officer / Volunteer** | Offline-First Mobile Form | Offline hazard reporting, GPS accuracy meter (with manual checkpoint fallback), 4-way vehicle access matrix, photo compression, sync status queue (`saved_locally`, `waiting_network`, `sent`, `photo_pending`, `verified`). |
| **District Officer** | GIS Web Command Center | Interactive Leaflet GIS map with corridor segments, AI risk explanation breakdown, side-by-side field report verification with photo inspection, route engine recommendations (Route A vs Route B vs Route C), vehicle reroute dispatch. |
| **Head Office** | Regional Strategic Summary | Strategic corridor status, blocked segments metric, critical medicine missions tracker, vehicles at risk, unacknowledged alerts monitor, escalated incident triage, regional alert broadcast. |

---

## The 26-Step Demonstration Flow

The application includes an interactive **26-Step Guided Tour** that walks through the entire emergency response lifecycle:
1. Open application link.
2. View Install App / PWA modal prompt on mobile viewport.
3. Select "Continue in Browser".
4. Log in / switch to Driver role.
5. Review Shillong to Sohra emergency medicine mission (`M-001`, `V-001`).
6. Inspect route, ETA, and current location along `R-002`.
7. Switch to Field Officer role.
8. Save landslide report offline (`R-004`).
9. View "Waiting for Network" status in offline queue.
10. Simulate network reconnection.
11. View "Report Sent" and "Photo Pending" status.
12. Switch to District Officer dashboard.
13. View new incident plotted on GIS map.
14. Inspect AI risk explanation breakdown.
15. Inspect field report details and attached photograph.
16. Click [Verify Report].
17. Observe road segment `R-004` change to "Blocked for Trucks, Passable for Motorcycles".
18. View alternative route candidates generated by Route Engine.
19. Select safer Route B (via Umtyngar bypass `R-003-ALT`, +25 min delay).
20. Send emergency reroute alert to driver.
21. Switch back to Driver mobile screen.
22. Observe high-visibility reroute alert banner.
23. Click [Acknowledge Alert].
24. View updated vehicle GPS trajectory following Route B.
25. Click [Delivery Completed] at destination health facility.
26. Inspect comprehensive Decision Timeline audit log (`decision_events.csv`).

---

## Prototype Corridors & Datasets

- `data/road_segments.csv`: 5 core segments (`R-001` to `R-005`) + alternative bypass (`R-003-ALT`).
- `data/road_segments.geojson`: GeoJSON polylines for map rendering.
- `data/incidents.csv`: Historic and active incident catalog.
- `data/field_reports.csv`: Ground-truth reports with sync lifecycle.
- `data/weather_history.csv`: Automated Weather Station (AWS) rainfall and soil saturation telemetry.
- `data/vehicles.csv`: Active emergency transport fleet.
- `data/missions.csv`: Life-saving cargo manifests and routes.
- `data/risk_scores.csv`: Transparent weighted risk score components.
- `data/safe_hubs.csv`: Staging bases with shelters, fuel, and cargo transfer bays.
- `data/health_facilities.csv`: Destination health facilities.
- `data/gps_tracks.csv`: Vehicle GPS track log.
- `data/decision_events.csv`: Immutable event log of all system decisions.

---

## Getting Started

### 1. Run Backend (FastAPI)
```bash
# In repository root
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```
API Documentation will be accessible at: `http://localhost:8000/docs`

### 2. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Access the application locally at: `http://localhost:3000`

### 3. Live Cloud Deployment
- **Production URL:** **[https://ner-resq.vercel.app](https://ner-resq.vercel.app)**
- **Multi-Tab Live Sync:** Open Tab 1 as **[Driver](https://ner-resq.vercel.app/?role=driver)** and Tab 2 as **[District Officer](https://ner-resq.vercel.app/?role=district_officer)** to test cross-tab real-time dispatch and driver help requests.

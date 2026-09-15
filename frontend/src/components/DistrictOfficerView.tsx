'use client';

import React, { useState } from 'react';
import { useResQ } from '../lib/resqContext';
import { CorridorMap } from './CorridorMap';
import { RoadSegment, FieldReport } from '../types/resq';
import { 
  ShieldAlert, 
  Map, 
  Check, 
  X, 
  RotateCcw, 
  AlertOctagon, 
  Navigation, 
  Clock, 
  Send, 
  FileText, 
  Cpu, 
  Truck, 
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Radio,
  ExternalLink,
  CheckCircle2,
  Package,
  Compass,
  ArrowLeft
} from 'lucide-react';

export const DistrictOfficerView: React.FC = () => {
  const {
    segments,
    incidents,
    fieldReports,
    vehicles,
    missions,
    selectedSegment,
    setSelectedSegment,
    selectedReport,
    setSelectedReport,
    verifyReport,
    rerouteMission,
    stageCargoAtHub,
    cargoStagedAtHub,
    decisionEvents,
    activeAlert,
    setSelectedRole
  } = useResQ();

  const [activeTab, setActiveTab] = useState<'map' | 'reports' | 'routes' | 'timeline'>('map');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Active mission & vehicle
  const mission = missions.find(m => m.mission_id === 'M-001') || missions[0];
  const vehicle = vehicles.find(v => v.vehicle_id === 'V-001') || vehicles[0];

  // Target segment for AI review panel (defaults to R-004 or selected)
  const inspectSegment = selectedSegment || segments.find(s => s.segment_id === 'R-004') || segments[0];
  const inspectReport = selectedReport || fieldReports.find(r => r.segment_id === inspectSegment.segment_id) || fieldReports[0];

  // Corridor route status
  const isR004Blocked = segments.find(s => s.segment_id === 'R-004')?.truck_access === 'blocked';
  const isAllBlocked = segments.every(s => s.truck_access === 'blocked');

  const handleVerify = () => {
    if (inspectReport) {
      verifyReport(inspectReport.report_id, 'verify', 'Ground-truth confirmed: Landslide debris completely blocking truck lane.');
    }
  };

  const handleReject = () => {
    if (inspectReport) {
      verifyReport(inspectReport.report_id, 'reject', 'Report rejected by district officer: clear upon visual inspection.');
    }
  };

  const handleReroute = () => {
    rerouteMission(
      'M-001',
      'R-001>R-002>R-003-ALT>R-005',
      25,
      'ROAD BLOCKED AHEAD (2.4 KM). TAKE ROUTE B (VIA UMTYNGAR BYPASS). DELAY: +25 MIN'
    );
  };

  const handleBroadcast = () => {
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 4000);
  };

  return (
    <div className="w-full bg-slate-100 min-h-screen p-4 md:p-6 flex flex-col gap-5 font-sans text-slate-900">
      {/* Top District Officer Command Bar */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedRole(null)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm flex-shrink-0"
            title="Return to role selection"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" />
            <span>Back</span>
          </button>
          <div className="bg-purple-600 p-2.5 rounded-xl shadow-md flex-shrink-0">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-400 tracking-wider uppercase flex items-center gap-1.5">
              <span>District Officer Dashboard</span>
              <span className="text-slate-500">•</span>
              <span>East Khasi Hills DEOC</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Shillong → Sohra Corridor Command Center
            </h1>
          </div>
        </div>

        {/* Global Alert / Quick Metrics */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Corridor Status:</span>{' '}
            <span className={`font-bold uppercase ${isR004Blocked ? 'text-amber-400' : 'text-emerald-400'}`}>
              {isR004Blocked ? 'Restricted / Rerouted' : 'Open / Monitoring'}
            </span>
          </div>

          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400">Active Supply:</span>{' '}
            <span className="font-bold text-emerald-400">{mission.cargo_type.toUpperCase()} ({vehicle.vehicle_id})</span>
          </div>

          <button
            onClick={handleBroadcast}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md active:scale-95"
          >
            <AlertOctagon className="w-4 h-4" />
            DEOC Emergency Broadcast
          </button>
        </div>
      </div>

      {broadcastSuccess && (
        <div className="bg-red-100 border border-red-400 text-red-900 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-red-600 flex-shrink-0" />
          Corridor Emergency Broadcast dispatched to all district responders and field monitoring units.
        </div>
      )}

      {/* Live Mission Tracking Strip */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Emergency Mission Status: <span className="font-mono text-blue-700 font-bold">{mission.mission_id}</span>
            </div>
            <div className="text-sm font-black text-slate-900 flex items-center gap-2">
              <span>{mission.origin} → {mission.destination}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                mission.mission_status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                mission.mission_status === 'rerouted' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
              }`}>
                {mission.mission_status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold">Vehicle & Driver</div>
            <div className="font-bold text-slate-900 mt-0.5">{vehicle.vehicle_id} • {vehicle.driver_name}</div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold">Current Assigned Route</div>
            <div className="font-bold text-blue-700 mt-0.5">
              {mission.current_route.includes('R-003-ALT') ? 'Route B (Umtyngar Bypass)' : 'Route A (Direct Highway)'}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold">Driver Alert Status</div>
            <div className={`font-bold mt-0.5 ${activeAlert.acknowledged ? 'text-emerald-700' : activeAlert.show ? 'text-red-600 animate-pulse' : 'text-slate-600'}`}>
              {activeAlert.acknowledged ? '✓ Acknowledged by Driver' : activeAlert.show ? '⚠ Alert Pending Driver Ack' : 'Normal Navigation'}
            </div>
          </div>

          <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="text-[10px] text-slate-500 font-bold">ETA at Sohra CHC</div>
            <div className="font-bold text-slate-900 mt-0.5">
              {mission.current_eta_utc} {mission.delay_minutes > 0 ? `(+${mission.delay_minutes}m)` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (GIS Map / Reports / Routes / Timeline) + Right Column (AI Risk & Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* View Mode Tabs */}
          <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold">
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'map' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Map className="w-4 h-4" /> GIS Live Map
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'reports' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4" /> Field Reports ({fieldReports.length})
              </button>

              <button
                onClick={() => setActiveTab('routes')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'routes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Navigation className="w-4 h-4" /> Route Engine
              </button>

              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
                  activeTab === 'timeline' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4" /> Audit Timeline ({decisionEvents.length})
              </button>
            </div>

            <div className="text-[11px] text-slate-500 pr-2 hidden sm:block">
              Shillong–Sohra Pilot Corridor
            </div>
          </div>

          {/* TAB 1: GIS Map */}
          {activeTab === 'map' && (
            <>
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col gap-2">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pilot Corridor GIS Layers & Vehicle Tracking
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click any road segment or incident marker to inspect
                  </span>
                </div>
                <CorridorMap height="460px" onSelectSegment={(seg) => setSelectedSegment(seg)} />
              </div>

              {/* 5 Prototype Corridor Segments Strip */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Corridor Segments Status
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {segments.map((seg) => (
                    <div
                      key={seg.segment_id}
                      onClick={() => setSelectedSegment(seg)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        inspectSegment.segment_id === seg.segment_id
                          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900">{seg.segment_id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          seg.road_status === 'blocked' ? 'bg-red-100 text-red-700' :
                          seg.road_status === 'restricted' ? 'bg-amber-100 text-amber-800' :
                          seg.road_status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {seg.road_status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 truncate">{seg.segment_name}</div>
                      <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
                        <span>Risk: <b>{seg.risk_score}</b> ({seg.risk_level})</span>
                        <span>Truck: <b className={seg.truck_access === 'blocked' ? 'text-red-600' : 'text-emerald-700'}>{seg.truck_access}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Field Reports List */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Incoming Ground-Truth Reports</h3>
                <span className="text-xs text-slate-500">{fieldReports.length} reports logged</span>
              </div>

              <div className="space-y-3">
                {fieldReports.map((rep) => (
                  <div
                    key={rep.report_id}
                    onClick={() => {
                      setSelectedReport(rep);
                      const seg = segments.find(s => s.segment_id === rep.segment_id);
                      if (seg) setSelectedSegment(seg);
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      inspectReport?.report_id === rep.report_id
                        ? 'border-blue-500 bg-blue-50/40 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs">{rep.report_id}</span>
                        <span className="text-xs font-bold text-blue-700">• Segment {rep.segment_id}</span>
                        <span className="text-[11px] text-slate-500">by {rep.reporter_id} ({rep.reporter_role})</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rep.verification_status === 'verified' ? 'bg-emerald-100 text-emerald-800' :
                        rep.verification_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rep.verification_status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 font-medium mb-2">
                      {rep.description}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
                      <div><span className="text-slate-500">Hazard:</span> <b>{rep.incident_type}</b></div>
                      <div><span className="text-slate-500">Trucks:</span> <b className={rep.truck_access_reported === 'blocked' ? 'text-red-600' : 'text-emerald-600'}>{rep.truck_access_reported}</b></div>
                      <div><span className="text-slate-500">Motorcycles:</span> <b className={rep.motorcycle_access_reported === 'open' ? 'text-emerald-600' : 'text-amber-600'}>{rep.motorcycle_access_reported}</b></div>
                      <div><span className="text-slate-500">Sync:</span> <b className="text-slate-700">{rep.sync_status}</b></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Route Engine Comparison */}
          {activeTab === 'routes' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm">Corridor Route Candidate Evaluation</h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold text-slate-700">
                  Target: Medical Supply Truck (V-001)
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Route A */}
                <div className={`p-4 rounded-xl border ${
                  isR004Blocked ? 'border-red-300 bg-red-50/70' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 text-sm">Route A: Direct Mountain Highway (SH-5)</span>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-black uppercase ${
                      isR004Blocked ? 'bg-red-600 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isR004Blocked ? 'REJECTED — TRUCKS BLOCKED' : 'VIABLE'}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Path: R-001 → R-002 → R-003 → <b>R-004 (Mawkdok Gorge)</b> → R-005
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 grid grid-cols-3 gap-2">
                    <div>Distance: <b>54.1 km</b></div>
                    <div>Base ETA: <b>105 min</b></div>
                    <div>Status on R-004: <b className="text-red-600">{isR004Blocked ? 'Impassable (Landslide)' : 'Open'}</b></div>
                  </div>
                </div>

                {/* Route B */}
                <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 shadow-sm">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-950 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Route B: Umtyngar-Laitryngew Eastern Bypass
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-emerald-600 text-white uppercase">
                      SELECTED ALTERNATIVE ROUTE
                    </span>
                  </div>
                  <div className="text-slate-700 mt-1">
                    Path: R-001 → R-002 → <b>R-003-ALT (Eastern Bypass)</b> → R-005
                  </div>
                  <div className="mt-2 text-[11px] text-slate-700 grid grid-cols-3 gap-2 bg-white/80 p-2 rounded-lg border border-emerald-200">
                    <div>Distance: <b>60.6 km</b></div>
                    <div>Additional Delay: <b className="text-emerald-800">+25 min</b></div>
                    <div>Truck Clearance: <b className="text-emerald-700">100% Passable</b></div>
                  </div>
                </div>

                {/* Route C */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 text-sm">Route C: Scenic Terrace Ridge Secondary Link</span>
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-black bg-amber-100 text-amber-800 uppercase">
                      BACKUP RESERVE (+40 MIN)
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    Path: R-001 → R-002 → R-003 → R-003-ALT → R-005
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 grid grid-cols-3 gap-2">
                    <div>Distance: <b>65.2 km</b></div>
                    <div>Additional Delay: <b>+40 min</b></div>
                    <div>Grade: <b>Steep (Emergency use only)</b></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Audit Timeline */}
          {activeTab === 'timeline' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Chronological Decision Audit Log</h3>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2.5 py-1 rounded font-bold">
                  {decisionEvents.length} Events Logged
                </span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 text-xs">
                {decisionEvents.map((evt, idx) => (
                  <div key={evt.event_id || idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{evt.event_type.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-slate-700 mt-1 leading-relaxed">
                        {evt.event_description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Actor: <b className="text-slate-600">{evt.actor_role}</b> • Mission: <b className="text-slate-600">{evt.mission_id}</b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): AI Risk Review & Verification Actions */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* AI REVIEW PANEL (Formula Breakdown & Explainability) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm">AI Risk Evaluation</h2>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                inspectSegment.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                inspectSegment.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                inspectSegment.risk_level === 'moderate' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {inspectSegment.segment_id} — {inspectSegment.risk_level.toUpperCase()}
              </span>
            </div>

            {/* Plain-English AI Explanation */}
            <div className="text-xs text-slate-800 bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 leading-relaxed space-y-1.5">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-700" />
                <span>Explainable Assessment Summary:</span>
              </div>
              <div>
                {inspectSegment.segment_id === 'R-004' ? (
                  <span>
                    Heavy monsoonal precipitation detected, triggering slope shear instability along the Sohrarim gorge escarpment. Synchronized ground report confirms active rock and mud debris covering the roadway. <b>Truck lanes are completely obstructed. Human officer verification required.</b>
                  </span>
                ) : (
                  <span>
                    Atmospheric and soil moisture sensors indicate stable corridor conditions on segment {inspectSegment.segment_id}. No active landslides or road obstructions detected.
                  </span>
                )}
              </div>
            </div>

            {/* Risk Factors Breakdown */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2.5">
              <div className="flex items-center justify-between font-bold">
                <span className="text-slate-700">Calculated Risk Score:</span>
                <span className="text-base font-black text-slate-900">{inspectSegment.risk_score} / 100</span>
              </div>

              {/* Progress bars */}
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Rainfall Intensity</span>
                    <span className="font-bold">{inspectSegment.segment_id === 'R-004' ? 'High (80/100)' : 'Low (20/100)'}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${inspectSegment.segment_id === 'R-004' ? 80 : 20}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Terrain Slope Instability</span>
                    <span className="font-bold">{inspectSegment.slope_category.toUpperCase()} (85/100)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Ground-Truth Field Report</span>
                    <span className="font-bold">{inspectSegment.segment_id === 'R-004' ? 'Critical (90/100)' : 'Clear (15/100)'}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-600 h-full rounded-full" style={{ width: `${inspectSegment.segment_id === 'R-004' ? 90 : 15}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
              <span>Confidence: <b className="text-slate-800">{inspectSegment.confidence_score}%</b></span>
              <span>Review Status: <b className={inspectSegment.risk_score >= 51 ? 'text-red-600 font-bold' : 'text-emerald-700'}>{inspectSegment.risk_score >= 51 ? 'Action Required' : 'Nominal'}</b></span>
            </div>
          </div>

          {/* FIELD REPORT EVIDENCE & VERIFICATION */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="font-bold text-slate-900 text-sm">Field Evidence & Ground Truth</h2>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {inspectReport?.report_id || 'FR-001'}
              </span>
            </div>

            {inspectReport && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500">Field Officer:</span>{' '}
                    <b className="text-slate-800">{inspectReport.reporter_id}</b>
                  </div>
                  <div>
                    <span className="text-slate-500">Sector:</span>{' '}
                    <b className="text-slate-800">{inspectReport.segment_id}</b>
                  </div>
                  <div>
                    <span className="text-slate-500">Observed Hazard:</span>{' '}
                    <b className="text-red-700 uppercase">{inspectReport.incident_type}</b>
                  </div>
                  <div>
                    <span className="text-slate-500">GPS Accuracy:</span>{' '}
                    <b className="text-slate-800">±{inspectReport.gps_accuracy_meters}m</b>
                  </div>
                </div>

                {/* Ground photo evidence */}
                {inspectReport.photo_attached && inspectReport.photo_url && (
                  <div className="rounded-xl overflow-hidden border border-slate-300 shadow-inner">
                    <div className="text-[11px] font-bold bg-slate-800 text-white px-3 py-1 flex items-center justify-between">
                      <span>Ground-Truth Camera Evidence</span>
                      <span className="text-slate-300">Synchronized</span>
                    </div>
                    <img
                      src={inspectReport.photo_url}
                      alt="Field Ground Truth"
                      className="w-full h-32 object-cover"
                    />
                  </div>
                )}

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  <b>Field Note:</b> {inspectReport.description}
                </div>

                {/* Verification Actions */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleVerify}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Verify Truck Blockage
                  </button>

                  <button
                    onClick={handleReject}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition"
                  >
                    <X className="w-4 h-4 text-red-600" />
                    Reject
                  </button>

                  <button
                    onClick={() => setOverrideModalOpen(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Override
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ROUTE ENGINE & VEHICLE REROUTING DISPATCH */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-900 text-sm">Alternative Route Dispatch</h2>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                Truck V-001
              </span>
            </div>

            {isAllBlocked || cargoStagedAtHub ? (
              <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 text-red-700 font-black text-sm">
                  <AlertOctagon className="w-5 h-5" />
                  NO SAFE ROUTE AVAILABLE
                </div>
                <div className="text-slate-700 leading-relaxed font-semibold">
                  All corridor paths are impassable for heavy medical supply trucks. The system will NOT force a dangerous mountain passage.
                </div>
                <div className="bg-white p-3 rounded-lg border border-red-200 space-y-1.5 text-slate-800">
                  <div className="font-bold text-red-800">Safe-Hub Staging Protocol Activated:</div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><b>Staging Hub:</b> SH-001 (Mawkdok Emergency Logistics Hub)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span><b>Cargo Transfer:</b> Shift insulin vials to Motorcycle Courier (V-003)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {/* Route B Selected Card */}
                <div className="p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 shadow-sm space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-950 font-black flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Route B (Umtyngar Bypass)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white uppercase">
                      RECOMMENDED SAFER ROUTE
                    </span>
                  </div>
                  <div className="text-slate-700 text-[11px]">
                    Bypasses blocked landslide sector on R-004 via eastern mountain hillside. Adds <b>+25 minutes delay</b>.
                  </div>
                </div>

                {/* Dispatch Button */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={handleReroute}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    Approve Route B & Send Alert to Driver
                  </button>
                  <button
                    onClick={() => stageCargoAtHub('SH-001')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    <Building className="w-4 h-4" />
                    Stage Cargo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-base border-b border-slate-200 pb-3">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              District Officer Manual Override
            </div>
            <p className="text-slate-600 leading-relaxed">
              You are manually overriding the AI risk assessment and field status for segment <b>{inspectSegment.segment_id}</b>. This action will be permanently recorded in the audit trail.
            </p>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Override Justification</label>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                defaultValue="Visual inspection by local PWD junior engineer confirms single-lane clearance."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setOverrideModalOpen(false);
                  verifyReport(inspectReport.report_id, 'override', 'Manual override by District Officer');
                }}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

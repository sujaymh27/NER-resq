'use client';

import React, { useState } from 'react';
import { useResQ } from '../lib/resqContext';
import { DriverMap } from './DriverMap';
import { 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  MapPin, 
  Clock, 
  Package, 
  ShieldCheck, 
  ArrowLeft,
  Pause,
  Play,
  FileWarning,
  RotateCcw,
  Truck,
  Send,
  X,
  Radio,
  Crosshair
} from 'lucide-react';

const FROM_LOCATIONS = [
  'Shillong Warehouse',
  'Shillong Civil Hospital',
  'Upper Shillong Depot',
  'Police Bazar Base'
];

const TO_DESTINATIONS = [
  'Sohra Health Facility',
  'Sohra Emergency Depot',
  'Cherrapunji PHC',
  'Mawkdok Relay Station'
];

const CARGO_TYPES = [
  'Emergency Medicine',
  'Trauma Kits & IV Fluids',
  'Insulin & Blood Cold-Chain',
  'Pediatric Vaccines',
  'Antivenom & Oxygen Cylinders'
];

const ROUTES = [
  'Route A (Direct Highway via Mawkdok)',
  'Route B (Umtyngar Safer Bypass)'
];

export const DriverMobileView: React.FC = () => {
  const {
    vehicles,
    missions,
    activeAlert,
    acknowledgeDriverAlert,
    startMission,
    pauseMission,
    resumeMission,
    reportDriverProblem,
    completeMission,
    setSelectedRole,
    useDeviceGps,
    setUseDeviceGps
  } = useResQ();

  const vehicle = vehicles.find(v => v.vehicle_id === 'V-001') || vehicles[0];
  const mission = missions.find(m => m.mission_id === 'M-001') || missions[0];

  // Form State
  const [driverName, setDriverName] = useState(mission?.driver_name || 'Demo Driver');
  const [vehicleNumber, setVehicleNumber] = useState(mission?.vehicle_number || 'Truck TRUCK-01');
  const [fromLocation, setFromLocation] = useState(mission?.origin || 'Shillong Warehouse');
  const [toDestination, setToDestination] = useState(mission?.destination || 'Sohra Health Facility');
  const [cargoType, setCargoType] = useState(mission?.cargo_type || 'Emergency Medicine');
  const [missionPriority, setMissionPriority] = useState<'critical' | 'high' | 'medium' | 'low'>(mission?.cargo_priority || 'critical');
  const [assignedRoute, setAssignedRoute] = useState(ROUTES[0]);

  // Modal States
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [problemModalOpen, setProblemModalOpen] = useState(false);
  const [problemType, setProblemType] = useState('Landslide debris');
  const [problemDescription, setProblemDescription] = useState('Rockfall and gravel obstructing vehicle lane.');

  const isMissionActive = mission.mission_status !== 'Ready';
  const isPaused = mission.mission_status === 'Paused' || mission.mission_status === 'paused';
  const isDelivered = mission.mission_status === 'Delivered' || mission.mission_status === 'delivered';

  const handleStartMission = (e: React.FormEvent) => {
    e.preventDefault();
    startMission({
      driverName,
      vehicleNumber,
      fromLocation,
      toDestination,
      cargoType,
      missionPriority,
      assignedRoute
    });
  };

  const handleTogglePause = () => {
    if (isPaused) {
      resumeMission();
    } else {
      pauseMission();
    }
  };

  const handleReportProblem = (e: React.FormEvent) => {
    e.preventDefault();
    reportDriverProblem(problemType, problemDescription);
    setProblemModalOpen(false);
  };

  const handleCompleteDelivery = () => {
    completeMission(mission.mission_id);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-[700px] flex flex-col font-sans border border-slate-300 rounded-2xl shadow-xl overflow-hidden text-slate-900">
      {/* Driver Mobile Top Bar */}
      <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSelectedRole(null)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-xs font-bold transition border border-slate-700"
            title="Return to role selection"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back</span>
          </button>
          <div>
            <div className="text-[11px] font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Driver Dashboard
            </div>
            <div className="text-sm font-bold text-white leading-tight">{vehicle?.driver_name || driverName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-300 font-mono font-bold">{vehicle?.vehicle_number || vehicleNumber}</div>
          <div className="text-[10px] text-slate-400">Battery: <span className="text-emerald-400 font-semibold">{vehicle?.battery_percent}%</span></div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* MISSION-START FORM (Shown if mission is Ready) */}
        {!isMissionActive ? (
          <form onSubmit={handleStartMission} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Configure & Start Mission</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Ready to Depart
              </span>
            </div>

            {/* Driver Name & Vehicle Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Driver Name</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Demo Driver"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Vehicle Number</label>
                <input
                  type="text"
                  required
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Truck TRUCK-01"
                />
              </div>
            </div>

            {/* From Location & To Destination */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  From Location
                </label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {FROM_LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-600" />
                  To Destination
                </label>
                <select
                  value={toDestination}
                  onChange={(e) => setToDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {TO_DESTINATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cargo Type & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3 text-amber-600" />
                  Cargo Type
                </label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  {CARGO_TYPES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">Mission Priority</label>
                <select
                  value={missionPriority}
                  onChange={(e) => setMissionPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="critical">🔴 Critical (Life-saving)</option>
                  <option value="high">🟠 High Priority</option>
                  <option value="medium">🟡 Normal / Routine</option>
                  <option value="low">🟢 Low Priority</option>
                </select>
              </div>
            </div>

            {/* Assigned Route */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-blue-600" />
                Assigned Route
              </label>
              <select
                value={assignedRoute}
                onChange={(e) => setAssignedRoute(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-500 focus:bg-white"
              >
                {ROUTES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Clear START MISSION Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 px-4 rounded-xl text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2 tracking-wide"
            >
              <Send className="w-4 h-4 text-white" />
              START MISSION
            </button>
          </form>
        ) : (
          /* ACTIVE MISSION VIEW */
          <>
            {/* Simple Driver Map with minimum controls */}
            <DriverMap height="270px" />

            {/* Required Mission Summary Card */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Mission Manifest</div>
                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-tight ${
                    isDelivered ? 'bg-emerald-100 text-emerald-800' :
                    isPaused ? 'bg-amber-100 text-amber-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {mission.mission_status}
                  </span>
                </div>
              </div>

              {/* Exact format required:
                  Driver: Demo Driver
                  From: Shillong Warehouse
                  To: Sohra Health Facility
                  Status: In Transit
                  ETA: 2 hr 10 min
              */}
              <div className="text-xs font-mono bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-800 space-y-1">
                <div><span className="text-slate-500 font-bold">Driver:</span> <span className="font-bold text-slate-900">{mission.driver_name || vehicle.driver_name}</span></div>
                <div><span className="text-slate-500 font-bold">Vehicle:</span> <span className="font-bold text-slate-900">{mission.vehicle_number || 'Truck TRUCK-01'}</span></div>
                <div><span className="text-slate-500 font-bold">From:</span> <span className="font-bold text-slate-900">{mission.origin}</span></div>
                <div><span className="text-slate-500 font-bold">To:</span> <span className="font-bold text-slate-900">{mission.destination}</span></div>
                <div><span className="text-slate-500 font-bold">Status:</span> <span className="font-black text-blue-700">{mission.mission_status}</span></div>
                <div><span className="text-slate-500 font-bold">ETA:</span> <span className="font-black text-emerald-700">{mission.current_eta_utc}</span></div>
              </div>

              {/* Distance and Segment Telemetry */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Distance Left</div>
                  <div className="text-sm font-black text-slate-900">{mission.distance_remaining_km ?? 38.4} KM</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Current Road</div>
                  <div className="text-sm font-bold text-blue-700 truncate">{vehicle.current_segment_id}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Speed</div>
                  <div className="text-sm font-black text-emerald-600">{vehicle.speed_kmh} km/h</div>
                </div>
              </div>

              {/* Assigned Route details */}
              <div className="flex items-center justify-between text-xs text-slate-600 bg-blue-50/70 p-2 rounded-lg border border-blue-100">
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Route: <b>{mission.current_route.includes('R-003-ALT') ? 'Route B (Umtyngar Bypass)' : 'Route A (Direct Highway)'}</b></span>
                </div>
                <button
                  onClick={() => setUseDeviceGps(!useDeviceGps)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                    useDeviceGps ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                  title="Toggle between simulated tracking and actual device GPS"
                >
                  <Crosshair className="w-3 h-3" />
                  {useDeviceGps ? 'GPS On' : 'Use GPS'}
                </button>
              </div>
            </div>

            {/* EMERGENCY ROAD WARNING BANNER */}
            {activeAlert.show && (
              <div className="bg-red-50 border-2 border-red-600 rounded-xl p-4 shadow-lg animate-bounce-slow">
                <div className="flex items-start gap-3">
                  <div className="bg-red-600 text-white p-2 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="text-red-700 font-black text-base uppercase tracking-tight">
                      🔴 {activeAlert.title}
                    </div>
                    <div className="text-xs text-slate-700 mt-1 font-semibold">
                      Affected: {activeAlert.roadName}
                    </div>
                    <div className="bg-white/90 p-2 rounded mt-2 border border-red-200">
                      <div className="text-xs font-bold text-blue-900">{activeAlert.routeBypass}</div>
                      <div className="text-xs font-bold text-red-600 mt-0.5">{activeAlert.delayText}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={acknowledgeDriverAlert}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    ACKNOWLEDGE
                  </button>
                  <button
                    onClick={() => setCallModalOpen(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg text-xs shadow-md active:scale-95 transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    CALL CONTROL ROOM
                  </button>
                </div>
              </div>
            )}

            {/* Acknowledged Status Pill */}
            {activeAlert.acknowledged && !activeAlert.show && (
              <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  Alert Acknowledged. Following Route B via Umtyngar bypass. Proceed with caution.
                </div>
              </div>
            )}

            {/* Mission Delivered Banner */}
            {isDelivered && (
              <div className="bg-emerald-100 border-2 border-emerald-600 p-4 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div className="font-black text-emerald-900 text-base">
                  DELIVERY COMPLETED SAFELY
                </div>
                <div className="text-xs text-emerald-800 font-medium">
                  {mission.cargo_type} safely delivered to {mission.destination}. Mission status: Delivered.
                </div>
              </div>
            )}

            {/* In-Transit Action Controls:
                [PAUSE MISSION]
                [REPORT PROBLEM]
                [CALL CONTROL ROOM]
                [COMPLETE DELIVERY]
            */}
            <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-2">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Driver Mission Controls
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* PAUSE / RESUME BUTTON */}
                <button
                  onClick={handleTogglePause}
                  disabled={isDelivered}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                    isPaused
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                  } disabled:opacity-50`}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'RESUME MISSION' : 'PAUSE MISSION'}
                </button>

                {/* REPORT PROBLEM BUTTON */}
                <button
                  onClick={() => setProblemModalOpen(true)}
                  disabled={isDelivered}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 transition disabled:opacity-50"
                >
                  <FileWarning className="w-4 h-4 text-rose-600" />
                  REPORT PROBLEM
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* CALL CONTROL ROOM BUTTON */}
                <button
                  onClick={() => setCallModalOpen(true)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  CALL CONTROL ROOM
                </button>

                {/* COMPLETE DELIVERY BUTTON */}
                <button
                  onClick={handleCompleteDelivery}
                  disabled={isDelivered}
                  className="py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-500"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  COMPLETE DELIVERY
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Call Control Room Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
              <Phone className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base">District Control Room</div>
              <div className="text-xs text-slate-500 mt-0.5">East Khasi Hills DEOC Hotline</div>
              <div className="text-sm font-mono font-black text-blue-600 mt-1">1070 / +91-364-2224010</div>
            </div>
            <div className="text-xs text-left bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 leading-relaxed">
              <b>Duty Officer:</b> &quot;Truck {vehicle.vehicle_id}, driver {vehicle.driver_name}, we have your live GPS location on {vehicle.current_segment_id}. All units standing by.&quot;
            </div>
            <button
              onClick={() => setCallModalOpen(false)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-slate-800 transition"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Report Problem Modal */}
      {problemModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReportProblem} className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 font-black text-rose-700 text-sm">
                <FileWarning className="w-4 h-4" />
                <span>Report Road Problem</span>
              </div>
              <button
                type="button"
                onClick={() => setProblemModalOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Problem Type</label>
              <select
                value={problemType}
                onChange={(e) => setProblemType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-rose-500"
              >
                <option value="Landslide debris">Landslide Debris / Rockfall</option>
                <option value="Fallen tree">Fallen Tree / Heavy Obstruction</option>
                <option value="Road damage">Road Cracking / Subside</option>
                <option value="Waterlogging">Flash Flood / Heavy Waterlogging</option>
                <option value="Vehicle breakdown">Mechanical Breakdown</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Description & Location Note</label>
              <textarea
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                placeholder="Describe road blockage or obstacle..."
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
              >
                Send Incident Alert
              </button>
              <button
                type="button"
                onClick={() => setProblemModalOpen(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

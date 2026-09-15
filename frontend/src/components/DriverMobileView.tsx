'use client';

import React, { useState } from 'react';
import { useResQ } from '../lib/resqContext';
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
  Search,
  Check,
  Edit3,
  ChevronDown
} from 'lucide-react';

const SUGGESTED_ORIGINS = [
  { id: 'shillong_gate', label: 'Shillong Logistics Gate (Main Base)', short: 'Shillong Logistics Gate' },
  { id: 'shillong_hospital', label: 'Shillong Civil Hospital (Cold Chain Depot)', short: 'Shillong Civil Hospital' },
  { id: 'upper_shillong', label: 'Upper Shillong Emergency Warehouse', short: 'Upper Shillong Depot' },
  { id: 'police_bazar', label: 'Police Bazar Transit Station', short: 'Police Bazar Base' }
];

const SUGGESTED_DESTINATIONS = [
  { id: 'sohra_chc', label: 'Sohra Community Health Facility (Primary CHC)', short: 'Sohra Community Health Facility' },
  { id: 'sohra_depot', label: 'Sohra Emergency Relief Depot', short: 'Sohra Emergency Depot' },
  { id: 'cherra_phc', label: 'Cherrapunji Primary Health Centre (PHC)', short: 'Cherrapunji PHC' },
  { id: 'mawkdok_relay', label: 'Mawkdok Bridge Relay Station', short: 'Mawkdok Relay Post' }
];

export const DriverMobileView: React.FC = () => {
  const {
    vehicles,
    missions,
    activeAlert,
    acknowledgeDriverAlert,
    completeMission,
    currentDemoStep,
    setSelectedRole
  } = useResQ();

  const [callModalOpen, setCallModalOpen] = useState(false);
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false);

  // Dynamic Route Selection state
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [originInput, setOriginInput] = useState('Shillong Logistics Gate');
  const [destinationInput, setDestinationInput] = useState('Sohra Community Health Facility');
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const vehicle = vehicles.find(v => v.vehicle_id === 'V-001') || vehicles[0];
  const mission = missions.find(m => m.mission_id === 'M-001') || missions[0];

  const handleSaveRoute = () => {
    mission.origin = originInput;
    mission.destination = destinationInput;
    setIsEditingRoute(false);
  };

  const handleComplete = () => {
    completeMission(mission.mission_id);
    setDeliveryConfirmed(true);
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
            <div className="text-base font-bold text-white leading-tight">{vehicle?.driver_name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Truck ID: <span className="font-mono text-slate-200">{vehicle?.vehicle_id}</span></div>
          <div className="text-xs text-slate-400">Battery: <span className="text-emerald-400">{vehicle?.battery_percent}%</span></div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        {/* Dynamic Mission / Route Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mission Details</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                {mission.mission_id} • CRITICAL
              </span>
              <button
                onClick={() => setIsEditingRoute(!isEditingRoute)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition"
                title="Change Origin & Destination"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* If editing route or user wants to customize dynamic route */}
          {isEditingRoute ? (
            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-blue-200 animate-in fade-in duration-150">
              <div className="text-xs font-bold text-blue-900">Select Corridor Origin & Destination:</div>
              
              {/* FROM / Origin input with suggestions */}
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  FROM (ORIGIN)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={originInput}
                    onChange={(e) => setOriginInput(e.target.value)}
                    onFocus={() => setShowOriginSuggestions(true)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                    placeholder="Type or select starting point..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowOriginSuggestions(!showOriginSuggestions)}
                    className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-xs font-bold"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showOriginSuggestions && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden text-xs">
                    {SUGGESTED_ORIGINS.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setOriginInput(s.short);
                          setShowOriginSuggestions(false);
                        }}
                        className="p-2 hover:bg-blue-50 cursor-pointer text-slate-800 border-b border-slate-100 last:border-none flex items-center justify-between"
                      >
                        <span>{s.label}</span>
                        {originInput === s.short && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TO / Destination input with suggestions */}
              <div className="relative">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-red-500" />
                  TO (DESTINATION)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    onFocus={() => setShowDestSuggestions(true)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                    placeholder="Type or select destination..."
                  />
                  <button
                    type="button"
                    onClick={() => setShowDestSuggestions(!showDestSuggestions)}
                    className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-xs font-bold"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showDestSuggestions && (
                  <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg overflow-hidden text-xs">
                    {SUGGESTED_DESTINATIONS.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setDestinationInput(s.short);
                          setShowDestSuggestions(false);
                        }}
                        className="p-2 hover:bg-blue-50 cursor-pointer text-slate-800 border-b border-slate-100 last:border-none flex items-center justify-between"
                      >
                        <span>{s.label}</span>
                        {destinationInput === s.short && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveRoute}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirm Route
                </button>
                <button
                  onClick={() => setIsEditingRoute(false)}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Static display when not editing, clicking opens the selector */
            <div 
              onClick={() => setIsEditingRoute(true)}
              className="grid grid-cols-2 gap-3 text-sm p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-200"
              title="Click to change origin or destination"
            >
              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  FROM
                </div>
                <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">{mission.origin}</div>
              </div>

              <div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  TO DESTINATION
                </div>
                <div className="font-bold text-slate-900 mt-0.5 text-xs truncate">{mission.destination}</div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-amber-500" />
              CARGO
            </div>
            <div className="font-bold text-slate-800 text-xs mt-0.5">
              {mission.cargo_description}
            </div>
          </div>
        </div>

        {/* Telemetry Strip: ETA & Current Location */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">ETA</div>
            <div className="text-lg font-black text-slate-900 mt-1 flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-blue-600" />
              {mission.current_eta_utc}
            </div>
            {mission.delay_minutes > 0 && (
              <div className="text-[10px] text-amber-600 font-bold mt-0.5">+{mission.delay_minutes}m delay</div>
            )}
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Remaining</div>
            <div className="text-lg font-black text-slate-900 mt-1">
              {vehicle.mission_status === 'delivered' ? '0.0 KM' : '38.4 KM'}
            </div>
            <div className="text-[10px] text-slate-400">Direct distance</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Current Road</div>
            <div className="text-sm font-bold text-blue-700 mt-1 truncate">
              {vehicle.current_segment_id}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">{vehicle.speed_kmh} km/h</div>
          </div>
        </div>

        {/* Assigned Route Display */}
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-xs text-slate-500 font-bold uppercase">Assigned Route</div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {mission.current_route.includes('R-003-ALT')
                  ? 'Route B (Umtyngar Bypass)'
                  : 'Route A (Direct Highway)'}
              </div>
            </div>
          </div>
          <span className="text-xs bg-white px-2 py-1 rounded font-bold border border-slate-200 text-slate-700">
            {mission.current_route.includes('R-003-ALT') ? 'SAFER BYPASS' : 'PRIMARY'}
          </span>
        </div>

        {/* EMERGENCY ROAD WARNING BANNER (High Visibility, Red Pulsing) */}
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
                <div className="bg-white/80 p-2 rounded mt-2 border border-red-200">
                  <div className="text-xs font-bold text-blue-900">{activeAlert.routeBypass}</div>
                  <div className="text-xs font-bold text-red-600 mt-0.5">{activeAlert.delayText}</div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={acknowledgeDriverAlert}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                ACKNOWLEDGE
              </button>
              <button
                onClick={() => setCallModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-lg text-sm shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                CALL
              </button>
            </div>
          </div>
        )}

        {/* Acknowledged Status Pill */}
        {activeAlert.acknowledged && !activeAlert.show && (
          <div className="bg-emerald-50 border border-emerald-300 p-3 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              Reroute Acknowledged. Following safer Route B via Umtyngar bypass. Drive with caution.
            </div>
          </div>
        )}

        {/* Mission Delivered Banner */}
        {vehicle.mission_status === 'delivered' && (
          <div className="bg-emerald-100 border-2 border-emerald-600 p-4 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="font-black text-emerald-900 text-base">
              DELIVERY COMPLETED SAFELY
            </div>
            <div className="text-xs text-emerald-800 font-medium">
              Emergency medicine safely received at Sohra Community Health Facility. Cold chain intact.
            </div>
          </div>
        )}
      </div>

      {/* Driver Actions Footer */}
      <div className="bg-white border-t border-slate-200 p-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setCallModalOpen(true)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-300 transition"
          >
            <Phone className="w-4 h-4 text-blue-600" />
            CALL CONTROL ROOM
          </button>

          {vehicle.mission_status !== 'delivered' ? (
            <button
              onClick={handleComplete}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              DELIVERY COMPLETED
            </button>
          ) : (
            <button
              disabled
              className="flex-1 bg-slate-200 text-slate-500 font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              MISSION FINISHED
            </button>
          )}
        </div>
      </div>

      {/* Call Control Room Modal */}
      {callModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
              <Phone className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-base">Control Room Hotline</div>
              <div className="text-xs text-slate-500 mt-1">Meghalaya Disaster Management Authority (MDMA)</div>
              <div className="text-sm font-mono font-bold text-blue-600 mt-1">1070 / +91-364-2224010</div>
            </div>
            <div className="text-xs text-left bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600">
              <b>Duty Officer:</b> &quot;Truck V-001, we have your GPS. Landslide on R-004 is verified. Your reroute to Route B via Umtyngar bypass is confirmed clear. Proceed cautiously.&quot;
            </div>
            <button
              onClick={() => setCallModalOpen(false)}
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs"
            >
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

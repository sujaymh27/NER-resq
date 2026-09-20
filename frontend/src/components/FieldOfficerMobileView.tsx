'use client';

import React, { useState } from 'react';
import { useResQ } from '../lib/resqContext';
import { IncidentType, RoadStatus, VehicleAccess, SyncStatus } from '../types/resq';
import {
  Wifi,
  WifiOff,
  Camera,
  MapPin,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  Compass,
  Truck,
  Bus,
  Bike,
  Ambulance,
  ArrowLeft
} from 'lucide-react';

export const FieldOfficerMobileView: React.FC = () => {
  const {
    fieldReports,
    saveOfflineReport,
    syncOfflineReports,
    networkState,
    setNetworkState,
    setSelectedRole
  } = useResQ();

  // Form states
  const [problem, setProblem] = useState<IncidentType>('landslide');
  const [segmentId, setSegmentId] = useState<string>('R-004');
  const [manualCheckpoint, setManualCheckpoint] = useState<string>('Sohrarim Hairpin Checkpoint');
  const [useManualGps, setUseManualGps] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(8);
  const [roadStatus, setRoadStatus] = useState<RoadStatus>('blocked');
  const [truckAccess, setTruckAccess] = useState<VehicleAccess>('blocked');
  const [busAccess, setBusAccess] = useState<VehicleAccess>('blocked');
  const [motorcycleAccess, setMotorcycleAccess] = useState<VehicleAccess>('open');
  const [emergencyAccess, setEmergencyAccess] = useState<VehicleAccess>('restricted');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('critical');
  const [shortNote, setShortNote] = useState<string>('Massive debris slide covering 35m of roadway. Truck lane completely obstructed; motorcycle shoulder passable with care.');
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%2364748b"/><polygon points="40,240 180,60 320,240" fill="%2378350f"/><polygon points="120,240 240,110 380,240" fill="%2392400e"/><circle cx="210" cy="180" r="28" fill="%23451a03"/><circle cx="160" cy="200" r="18" fill="%23451a03"/><circle cx="260" cy="210" r="22" fill="%23451a03"/><rect x="0" y="210" width="400" height="30" fill="%23334155"/><text x="20" y="40" fill="white" font-family="sans-serif" font-weight="bold" font-size="16">R-004 LANDSLIDE CHOKING TRUCK LANE</text><text x="20" y="65" fill="%23fef08a" font-family="sans-serif" font-size="13">GPS: 25.3376°N, 91.7351°E (±8m) | FO-021</text></svg>'
  );
  const [photoFileName, setPhotoFileName] = useState<string | null>('landslide_debris_sector4.jpg');
  const [photoSizeKb, setPhotoSizeKb] = useState<number | null>(85);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPhotoPreview(dataUrl);
        setPhotoFileName(file.name);
        setPhotoSizeKb(Math.round(file.size / 1024));
      };
      reader.readAsDataURL(file);
    }
  };

  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const handleSubmit = (forceOffline: boolean = false) => {
    if (forceOffline && networkState !== 'offline') {
      setNetworkState('offline');
    }

    const created = saveOfflineReport({
      segment_id: segmentId,
      incident_type: problem,
      road_status_reported: roadStatus,
      truck_access_reported: truckAccess,
      bus_access_reported: busAccess,
      motorcycle_access_reported: motorcycleAccess,
      emergency_access_reported: emergencyAccess,
      severity,
      description: shortNote,
      gps_accuracy_meters: gpsAccuracy,
      photo_attached: !!photoPreview,
      photo_url: photoPreview || undefined
    });

    setSubmissionFeedback(`Report ${created.report_id} saved as: ${created.sync_status.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => setSubmissionFeedback(null), 5000);
  };

  const getSyncBadge = (status: SyncStatus) => {
    switch (status) {
      case 'saved_locally':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 text-slate-700">💾 Saved Offline</span>;
      case 'waiting_network':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">⏳ Waiting for Network</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">📤 Sent</span>;
      case 'photo_pending':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">📸 Photo Pending</span>;
      case 'under_review':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-yellow-100 text-yellow-800">🔍 Under Review</span>;
      case 'verified':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">✅ Verified</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">❌ Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-0 bg-slate-50 font-sans overflow-hidden text-slate-900">
      {/* Field Officer Top Header */}
      <div className="bg-slate-900 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSelectedRole(null)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-xs font-bold transition border border-slate-700"
            title="Return to role selection"
          >
            <ArrowLeft className="w-4 h-4 text-blue-400" />
            <span>Back</span>
          </button>
          <div>
            <div className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase flex items-center gap-1">
              <Compass className="w-3 h-3" />
              Field Officer Dashboard
            </div>
            <div className="text-base font-bold text-white leading-tight">FO-021 • Mawkdok Sector</div>
          </div>
        </div>

        {/* Native Mobile Sync Indicator */}
        <div className="flex items-center gap-2">
          {fieldReports.some(r => r.sync_status === 'saved_locally' || r.sync_status === 'waiting_network') ? (
            <button
              onClick={syncOfflineReports}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition active:scale-95"
              title="Sync pending local reports"
            >
              <RotateCw className="w-3 h-3 animate-spin" />
              <span>Sync (1)</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Synced</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto min-h-0">
        {/* Offline Banner only when genuinely offline */}
        {networkState === 'offline' && (
          <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold text-amber-900">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Offline — Reports saved in phone storage will sync when connected.</span>
            </div>
            <button
              onClick={() => {
                setNetworkState('online');
                syncOfflineReports();
              }}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold flex-shrink-0 ml-2"
            >
              Sync
            </button>
          </div>
        )}

        {submissionFeedback && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {submissionFeedback}
          </div>
        )}

        {/* The Offline Report Form */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            New Ground-Truth Incident Report
          </div>

          {/* 1. Problem Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CURRENT PROBLEM</label>
            <select
              value={problem}
              onChange={(e) => setProblem(e.target.value as IncidentType)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="landslide">⛰️ Landslide</option>
              <option value="flood">🌊 Flood</option>
              <option value="bridge_damage">🌉 Bridge Damage</option>
              <option value="fallen_tree">🌲 Fallen Tree</option>
              <option value="road_damage">🚧 Road Damage</option>
              <option value="accident">💥 Accident</option>
              <option value="traffic_blockage">🛑 Traffic Blockage</option>
              <option value="heavy_rainfall">🌧️ Heavy Rainfall</option>
              <option value="other">⚠️ Other</option>
            </select>
          </div>

          {/* 2. GPS Location & Manual Checkpoint Fallback */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                GPS / Checkpoint
              </span>
              <button
                type="button"
                onClick={() => setUseManualGps(!useManualGps)}
                className="text-[11px] text-blue-600 font-bold underline"
              >
                {useManualGps ? 'Use Auto GPS' : 'Manual Fallback'}
              </button>
            </div>

            {!useManualGps ? (
              <div className="text-xs text-slate-600 flex items-center justify-between">
                <span>Coordinates: <b className="font-mono">25.3376° N, 91.7351° E</b></span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${gpsAccuracy <= 15 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                  ±{gpsAccuracy}m accuracy
                </span>
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-600">Manual Checkpoint Fallback</label>
                <select
                  value={manualCheckpoint}
                  onChange={(e) => setManualCheckpoint(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-800"
                >
                  <option value="Sohrarim Hairpin Checkpoint">Sohrarim Hairpin Checkpoint (R-004)</option>
                  <option value="Duwan Sing Syiem Bridge Post">Duwan Sing Syiem Bridge Post (R-003)</option>
                  <option value="Mylliem Police Outpost">Mylliem Police Outpost (R-002)</option>
                  <option value="Upper Shillong Forest Gate">Upper Shillong Forest Gate (R-001)</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-semibold text-slate-600">Road Corridor Segment</label>
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full mt-1 bg-white border border-slate-300 rounded p-1.5 text-xs font-bold text-slate-800"
              >
                <option value="R-001">R-001: Shillong to Upper Shillong</option>
                <option value="R-002">R-002: Upper Shillong to Mylliem</option>
                <option value="R-003">R-003: Mylliem to Mawkdok Gorge</option>
                <option value="R-004">R-004: Mawkdok to Sohra Approach</option>
                <option value="R-005">R-005: Sohra Approach to Health Facility</option>
              </select>
            </div>
          </div>

          {/* 3. Overall Road Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ROAD STATUS</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['open', 'restricted', 'blocked', 'unknown'] as RoadStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRoadStatus(st)}
                  className={`py-2 text-xs font-bold rounded-lg border uppercase transition ${roadStatus === st
                      ? st === 'blocked' ? 'bg-red-600 text-white border-red-600'
                        : st === 'restricted' ? 'bg-amber-500 text-white border-amber-500'
                          : st === 'open' ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-600 text-white border-slate-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Vehicle Access Matrix (Truck, Bus, Motorcycle, Emergency) */}
          <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-bold text-slate-700">VEHICLE ACCESS MATRIX</div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Truck Access */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  Heavy Truck
                </div>
                <select
                  value={truckAccess}
                  onChange={(e) => setTruckAccess(e.target.value as VehicleAccess)}
                  className="w-full text-xs font-bold p-1 rounded border border-slate-300"
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Bus Access */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                  <Bus className="w-3.5 h-3.5 text-indigo-600" />
                  Passenger Bus
                </div>
                <select
                  value={busAccess}
                  onChange={(e) => setBusAccess(e.target.value as VehicleAccess)}
                  className="w-full text-xs font-bold p-1 rounded border border-slate-300"
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Motorcycle Access */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  Motorcycle
                </div>
                <select
                  value={motorcycleAccess}
                  onChange={(e) => setMotorcycleAccess(e.target.value as VehicleAccess)}
                  className="w-full text-xs font-bold p-1 rounded border border-slate-300"
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              {/* Emergency Access */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="font-bold flex items-center gap-1 text-slate-800 mb-1">
                  <Ambulance className="w-3.5 h-3.5 text-red-600" />
                  Emergency Light
                </div>
                <select
                  value={emergencyAccess}
                  onChange={(e) => setEmergencyAccess(e.target.value as VehicleAccess)}
                  className="w-full text-xs font-bold p-1 rounded border border-slate-300"
                >
                  <option value="open">Open</option>
                  <option value="restricted">Restricted</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Severity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">SEVERITY</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-1.5 text-xs font-bold rounded-lg border uppercase transition ${severity === sev
                      ? sev === 'critical' ? 'bg-red-700 text-white border-red-700'
                        : sev === 'high' ? 'bg-orange-600 text-white border-orange-600'
                          : sev === 'medium' ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-300'
                    }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Real Photograph Upload (Device file / Camera / Compression) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Incident Photograph</label>
              {photoSizeKb ? (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Compressed ({photoSizeKb} KB)
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">JPG, PNG or Camera</span>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {photoPreview ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border-2 border-slate-300 bg-slate-900 shadow-inner">
                  <img src={photoPreview} alt="Incident" className="w-full h-36 object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2.5 py-1 rounded-md font-bold shadow"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setPhotoFileName(null);
                        setPhotoSizeKb(null);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-[10px] px-2.5 py-1 rounded-md font-bold shadow"
                    >
                      Remove
                    </button>
                  </div>
                  {photoFileName && (
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] px-2.5 py-1 truncate">
                      📷 {photoFileName} ({photoSizeKb || 85} KB)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* Real File Upload / Camera Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100/60 rounded-xl p-3 text-center text-blue-900 text-xs font-bold flex flex-col items-center justify-center gap-1 transition active:scale-98"
                >
                  <Camera className="w-5 h-5 text-blue-600" />
                  <span>Choose Photo / Camera</span>
                  <span className="text-[10px] text-blue-600 font-normal">Browse files or take photo</span>
                </button>

                {/* Sample Photo 1-Click Option */}
                <button
                  type="button"
                  onClick={() => {
                    setPhotoPreview(
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect width="400" height="240" fill="%23475569"/><polygon points="40,240 180,60 320,240" fill="%2378350f"/><polygon points="120,240 240,110 380,240" fill="%2392400e"/><circle cx="210" cy="180" r="28" fill="%23451a03"/><circle cx="160" cy="200" r="18" fill="%23451a03"/><circle cx="260" cy="210" r="22" fill="%23451a03"/><rect x="0" y="210" width="400" height="30" fill="%23334155"/><text x="20" y="40" fill="white" font-family="sans-serif" font-weight="bold" font-size="16">R-004 LANDSLIDE CHOKING TRUCK LANE</text><text x="20" y="65" fill="%23fef08a" font-family="sans-serif" font-size="13">GPS: 25.3376°N, 91.7351°E (±8m) | FO-021</text></svg>'
                    );
                    setPhotoFileName('sample_landslide_r004.jpg');
                    setPhotoSizeKb(85);
                  }}
                  className="border border-slate-300 bg-white hover:bg-slate-50 rounded-xl p-3 text-center text-slate-700 text-xs font-semibold flex flex-col items-center justify-center gap-1 transition active:scale-98"
                >
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <span>Use Sample Photo</span>
                  <span className="text-[10px] text-slate-500 font-normal">Pre-loaded landslide photo</span>
                </button>
              </div>
            )}
          </div>


          {/* 7. Short Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">SHORT NOTE</label>
            <textarea
              rows={2}
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none"
              placeholder="Provide field ground details..."
            />
          </div>

          {/* Actions: Save Offline & Submit Report */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="flex-1 bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              SAVE OFFLINE
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              SUBMIT REPORT
            </button>
          </div>
        </div>

        {/* Local Pending / Synchronized Queue */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-600 uppercase">Device Queue ({fieldReports.length})</span>
            {networkState === 'online' && (
              <button
                onClick={syncOfflineReports}
                className="text-[11px] text-blue-600 font-bold flex items-center gap-1 hover:underline"
              >
                <RotateCw className="w-3 h-3" /> Sync Now
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto">
            {fieldReports.slice(0, 5).map((rep) => (
              <div key={rep.report_id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{rep.report_id} • {rep.segment_id}</span>
                  {getSyncBadge(rep.sync_status)}
                </div>
                <div className="text-slate-600 text-[11px] truncate">{rep.description}</div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>{rep.incident_type.toUpperCase()} | Truck: {rep.truck_access_reported}</span>
                  <span>{rep.reported_at_local}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useResQ } from '../lib/resqContext';
import { RoadSegment, Incident, Vehicle } from '../types/resq';
import 'leaflet/dist/leaflet.css';

interface CorridorMapProps {
  height?: string;
  onSelectSegment?: (seg: RoadSegment) => void;
  interactive?: boolean;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  height = '500px',
  onSelectSegment,
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  const {
    segments,
    incidents,
    vehicles,
    safeHubs,
    healthFacilities,
    missions,
    selectedSegment,
    setSelectedSegment
  } = useResQ();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        // Center on Shillong-Sohra Corridor (~25.44 N, 91.80 E)
        const map = L.map(mapContainerRef.current, {
          center: [25.44, 91.80],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: interactive
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | NER ResQ Pilot',
          maxZoom: 18
        }).addTo(map);

        const layerGroup = L.layerGroup().addTo(map);
        layerGroupRef.current = layerGroup;
        mapInstanceRef.current = map;
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, interactive]);

  // Update Layers when state changes
  useEffect(() => {
    if (!isClient) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    import('leaflet').then((L) => {
      layerGroup.clearLayers();

      // 1. Draw Road Segments
      segments.forEach(seg => {
        if (!seg.coordinates || seg.coordinates.length < 2) return;

        let color = '#10b981'; // green: open
        let dashArray: string | undefined = undefined;
        let weight = 6;
        let opacity = 0.85;

        if (seg.road_status === 'blocked') {
          color = '#ef4444'; // red: blocked
          dashArray = '6, 8';
          weight = 7;
        } else if (seg.road_status === 'restricted') {
          color = '#f59e0b'; // amber/yellow: restricted
          weight = 6;
        } else if (seg.road_status === 'unknown') {
          color = '#6b7280'; // grey: unknown/stale
          dashArray = '4, 4';
          weight = 5;
        }

        if (selectedSegment?.segment_id === seg.segment_id) {
          weight = 10;
          opacity = 1.0;
        }

        const polyline = L.polyline(seg.coordinates, {
          color,
          weight,
          opacity,
          dashArray,
          lineCap: 'round',
          lineJoin: 'round'
        });

        polyline.on('click', () => {
          setSelectedSegment(seg);
          if (onSelectSegment) onSelectSegment(seg);
        });

        polyline.bindTooltip(
          `<b>${seg.segment_id}: ${seg.segment_name}</b><br/>Status: <b>${seg.road_status.toUpperCase()}</b> | Risk: ${seg.risk_score} (${seg.risk_level})<br/>Truck: ${seg.truck_access} | Motorcycle: ${seg.motorcycle_access}`,
          { sticky: true, className: 'resq-map-tooltip' }
        );

        layerGroup.addLayer(polyline);
      });

      // 2. Draw Assigned / Safer Routes
      const activeMission = missions.find(m => m.mission_id === 'M-001');
      if (activeMission && activeMission.current_route.includes('R-003-ALT')) {
        const altSeg = segments.find(s => s.segment_id === 'R-003-ALT');
        if (altSeg?.coordinates) {
          const routeLine = L.polyline(altSeg.coordinates, {
            color: '#2563eb', // Blue
            weight: 3,
            opacity: 0.9
          });
          routeLine.bindTooltip('Active Safer Route B (via Umtyngar Bypass)', { sticky: true });
          layerGroup.addLayer(routeLine);
        }
      }

      // 3. Draw Incidents
      incidents.forEach(inc => {
        let iconColor = '#ef4444';
        let iconSymbol = '⚠️';
        if (inc.incident_type === 'landslide') iconSymbol = '⛰️';
        else if (inc.incident_type === 'flood') iconSymbol = '🌊';
        else if (inc.incident_type === 'bridge_damage') iconSymbol = '🌉';
        else if (inc.incident_type === 'heavy_rainfall') iconSymbol = '🌧️';
        else if (inc.incident_type === 'fallen_tree') iconSymbol = '🌲';

        const html = `
          <div style="
            background: #ffffff;
            border: 2px solid ${iconColor};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            ${iconSymbol}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-incident-icon',
          html,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 220px;">
            <div style="font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
              ${inc.incident_type.replace('_', ' ').toUpperCase()} on ${inc.segment_id}
            </div>
            <div style="font-size: 12px; margin-bottom: 4px;"><b>Severity:</b> <span style="color: #dc2626; font-weight: bold;">${inc.severity.toUpperCase()}</span></div>
            <div style="font-size: 12px; margin-bottom: 4px;"><b>Status:</b> ${inc.verification_status}</div>
            <div style="font-size: 12px; margin-bottom: 6px; color: #475569;">${inc.description}</div>
            <div style="font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">Source: ${inc.data_source}</div>
          </div>
        `);
        layerGroup.addLayer(marker);
      });

      // 4. Draw Safe Hubs
      safeHubs.forEach(hub => {
        const html = `
          <div style="
            background: #0284c7;
            color: white;
            border: 2px solid white;
            border-radius: 6px;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          ">
            🛡️ ${hub.hub_id}
          </div>
        `;
        const hubIcon = L.divIcon({
          className: 'custom-hub-icon',
          html,
          iconSize: [60, 24],
          iconAnchor: [30, 12]
        });
        const marker = L.marker([hub.latitude, hub.longitude], { icon: hubIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif;">
            <b>${hub.hub_name} (${hub.hub_id})</b><br/>
            Capacity: ${hub.capacity_vehicle_count} vehicles<br/>
            Cargo Transfer Bay: ${hub.supports_cargo_transfer ? 'Yes (Truck ⇄ Motorcycle)' : 'No'}<br/>
            Emergency Shelter: ${hub.has_shelter ? 'Active' : 'None'}<br/>
            Contact: ${hub.contact_role}
          </div>
        `);
        layerGroup.addLayer(marker);
      });

      // 5. Draw Health Facilities
      healthFacilities.forEach(fac => {
        const html = `
          <div style="
            background: #dc2626;
            color: white;
            border: 2px solid white;
            border-radius: 6px;
            padding: 3px 6px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          ">
            🏥 ${fac.facility_name}
          </div>
        `;
        const facIcon = L.divIcon({
          className: 'custom-facility-icon',
          html,
          iconSize: [80, 24],
          iconAnchor: [40, 12]
        });
        const marker = L.marker([fac.latitude, fac.longitude], { icon: facIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif;">
            <b>${fac.facility_name}</b><br/>
            Destination Health Center<br/>
            Priority: <b>${fac.emergency_supply_priority.toUpperCase()}</b><br/>
            Cold Storage Available: ${fac.cold_storage_available ? 'Yes' : 'No'}
          </div>
        `);
        layerGroup.addLayer(marker);
      });

      // 6. Draw Vehicles
      vehicles.forEach(veh => {
        const isTruck = veh.vehicle_type === 'medical_supply_truck';
        const symbol = isTruck ? '🚚' : '🏍️';
        const html = `
          <div style="
            position: relative;
            background: #1e3a8a;
            border: 3px solid #60a5fa;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 0 12px #3b82f6;
            animation: pulse 2s infinite;
          ">
            ${symbol}
          </div>
        `;
        const vehIcon = L.divIcon({
          className: 'custom-veh-icon',
          html,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
        const marker = L.marker([veh.latitude, veh.longitude], { icon: vehIcon, zIndexOffset: 1000 });
        marker.bindPopup(`
          <div style="font-family: sans-serif;">
            <b style="color: #1e3a8a;">${veh.vehicle_id} (${veh.vehicle_type.replace('_', ' ')})</b><br/>
            Driver: ${veh.driver_name}<br/>
            Mission: ${veh.mission_id} (Critical Medicine)<br/>
            Speed: ${veh.speed_kmh} km/h | Battery: ${veh.battery_percent}%<br/>
            Status: <span style="font-weight: bold; color: #2563eb;">${veh.mission_status.toUpperCase()}</span>
          </div>
        `);
        layerGroup.addLayer(marker);
      });
    });
  }, [isClient, segments, incidents, vehicles, safeHubs, healthFacilities, missions, selectedSegment, setSelectedSegment, onSelectSegment]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="bg-slate-100 flex items-center justify-center">
        {!isClient && <span className="text-xs text-slate-400">Loading GIS Map...</span>}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-300 shadow-lg text-xs z-[1000] max-w-[210px]">
        <div className="font-bold text-slate-800 mb-1.5 border-b border-slate-200 pb-1">Corridor Map Legend</div>
        <div className="space-y-1 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
            <span>Open (Low/Mod Risk)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-amber-500 rounded-full inline-block"></span>
            <span>Restricted Access</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-red-500 border-dashed border-red-500 inline-block"></span>
            <span>Blocked (No Trucks)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1.5 bg-slate-400 inline-block"></span>
            <span>Unknown / Stale Data</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span>🚚</span>
            <span>V-001 (Medicine Truck)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🛡️</span>
            <span>Safe Logistics Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🏥</span>
            <span>Sohra Health Facility</span>
          </div>
        </div>
      </div>
    </div>
  );
};

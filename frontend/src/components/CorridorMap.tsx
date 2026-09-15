'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useResQ } from '../lib/resqContext';
import { RoadSegment, Incident, Vehicle } from '../types/resq';
import 'leaflet/dist/leaflet.css';

interface CorridorMapProps {
  height?: string;
  onSelectSegment?: (seg: RoadSegment) => void;
  onSelectVehicle?: (veh: Vehicle) => void;
  selectedVehicleId?: string;
  interactive?: boolean;
}

export const CorridorMap: React.FC<CorridorMapProps> = ({
  height = '500px',
  onSelectSegment,
  onSelectVehicle,
  selectedVehicleId,
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
          attribution: '&copy; OpenStreetMap | NER ResQ Corridor GIS',
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

      const activeMission = missions.find(m => m.mission_id === 'M-001');
      const isRouteBActive = activeMission?.current_route?.includes('R-003-ALT');

      // 1. Draw Road Segments with Required Status Colors:
      // Green: Open road
      // Yellow: Restricted road
      // Red: Blocked road
      // Grey: Unknown or stale road
      segments.forEach(seg => {
        if (!seg.coordinates || seg.coordinates.length < 2) return;

        let color = '#10b981'; // Green: Open
        let dashArray: string | undefined = undefined;
        let weight = 6;
        let opacity = 0.85;

        if (seg.road_status === 'blocked') {
          color = '#ef4444'; // Red: Blocked
          dashArray = '6, 8';
          weight = 7;
        } else if (seg.road_status === 'restricted') {
          color = '#f59e0b'; // Yellow: Restricted
          weight = 6;
        } else if (seg.road_status === 'unknown') {
          color = '#6b7280'; // Grey: Unknown / stale
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
          `<b>${seg.segment_id}: ${seg.segment_name}</b><br/>Status: <b>${seg.road_status.toUpperCase()}</b> | Risk: ${seg.risk_score} (${seg.risk_level})<br/>Truck Access: ${seg.truck_access.toUpperCase()}`,
          { sticky: true, className: 'resq-map-tooltip' }
        );

        layerGroup.addLayer(polyline);
      });

      // 2. Draw Route Lines:
      // Blue: Active assigned route
      // Green route: Recommended alternative
      // Dashed red route: Blocked route
      const activeSegIds = isRouteBActive
        ? ['R-001', 'R-002', 'R-003-ALT', 'R-005']
        : ['R-001', 'R-002', 'R-003', 'R-004', 'R-005'];

      const activeRouteCoords: [number, number][] = [];
      activeSegIds.forEach(id => {
        const s = segments.find(seg => seg.segment_id === id);
        if (s?.coordinates) activeRouteCoords.push(...s.coordinates);
      });

      if (activeRouteCoords.length > 1) {
        const blueRoute = L.polyline(activeRouteCoords, {
          color: '#2563eb', // Blue: Active assigned route
          weight: 4,
          opacity: 0.85,
          lineCap: 'round'
        });
        blueRoute.bindTooltip('🔵 Active Assigned Route', { sticky: true });
        layerGroup.addLayer(blueRoute);
      }

      // Recommended alternative route (Route B if Route A is currently active)
      if (!isRouteBActive) {
        const altSeg = segments.find(s => s.segment_id === 'R-003-ALT');
        if (altSeg?.coordinates) {
          const greenAltRoute = L.polyline(altSeg.coordinates, {
            color: '#059669', // Green route: Recommended alternative
            weight: 4,
            opacity: 0.75,
            dashArray: '4, 6'
          });
          greenAltRoute.bindTooltip('🟢 Recommended Alternative: Route B (Umtyngar Bypass)', { sticky: true });
          layerGroup.addLayer(greenAltRoute);
        }
      }

      // Blocked route line (R-004 if blocked)
      const r004 = segments.find(s => s.segment_id === 'R-004');
      if (r004?.coordinates && r004.road_status === 'blocked') {
        const redBlockedRoute = L.polyline(r004.coordinates, {
          color: '#dc2626', // Dashed red route: Blocked route
          weight: 6,
          opacity: 0.9,
          dashArray: '8, 8'
        });
        redBlockedRoute.bindTooltip('⛔ Dashed Red: Blocked Route (Landslide on R-004)', { sticky: true });
        layerGroup.addLayer(redBlockedRoute);
      }

      // 3. Shillong Origin Marker
      const shillongHtml = `
        <div style="
          background: #1e293b;
          color: #38bdf8;
          border: 2px solid #38bdf8;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        ">
          🏢 Shillong (Origin)
        </div>
      `;
      const shillongIcon = L.divIcon({
        className: 'custom-shillong-icon',
        html: shillongHtml,
        iconSize: [110, 24],
        iconAnchor: [55, 12]
      });
      const shillongMarker = L.marker([25.5600, 91.8700], { icon: shillongIcon });
      shillongMarker.bindPopup('<b>Shillong Central Warehouse</b><br/>Cold-chain depot & logistics dispatch base.');
      layerGroup.addLayer(shillongMarker);

      // 4. Sohra Destination Marker
      const sohraHtml = `
        <div style="
          background: #991b1b;
          color: #ffffff;
          border: 2px solid #ffffff;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 11px;
          font-weight: bold;
          white-space: nowrap;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        ">
          🏥 Sohra Health Facility
        </div>
      `;
      const sohraIcon = L.divIcon({
        className: 'custom-sohra-icon',
        html: sohraHtml,
        iconSize: [140, 24],
        iconAnchor: [70, 12]
      });
      const sohraMarker = L.marker([25.2913, 91.7210], { icon: sohraIcon });
      sohraMarker.bindPopup('<b>Sohra Community Health Facility</b><br/>Destination facility with emergency cold storage.');
      layerGroup.addLayer(sohraMarker);

      // 5. Draw Incidents
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
          </div>
        `);
        layerGroup.addLayer(marker);
      });

      // 6. Draw Safe Hubs
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
            Cargo Transfer: ${hub.supports_cargo_transfer ? 'Yes (Truck ⇄ Motorcycle)' : 'No'}<br/>
            Contact: ${hub.contact_role}
          </div>
        `);
        layerGroup.addLayer(marker);
      });

      // 7. Draw All Active Vehicles / Drivers
      vehicles.forEach(veh => {
        const isTruck = veh.vehicle_type === 'medical_supply_truck';
        const symbol = isTruck ? '🚚' : '🏍️';
        const isSelected = selectedVehicleId === veh.vehicle_id;

        const html = `
          <div style="
            position: relative;
            background: ${isSelected ? '#2563eb' : '#1e3a8a'};
            border: 3px solid ${isSelected ? '#fbbf24' : '#60a5fa'};
            border-radius: 50%;
            width: ${isSelected ? '44px' : '38px'};
            height: ${isSelected ? '44px' : '38px'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '22px' : '18px'};
            box-shadow: 0 0 16px ${isSelected ? '#f59e0b' : '#3b82f6'};
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${symbol}
          </div>
        `;
        const vehIcon = L.divIcon({
          className: 'custom-veh-icon',
          html,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([veh.latitude, veh.longitude], { icon: vehIcon, zIndexOffset: 2000 });

        marker.on('click', () => {
          if (onSelectVehicle) onSelectVehicle(veh);
        });

        marker.bindTooltip(
          `<b>${veh.driver_name} (${veh.vehicle_id})</b><br/>Status: <b>${veh.mission_status}</b><br/>Click to view driver panel`,
          { sticky: true }
        );

        layerGroup.addLayer(marker);
      });
    });
  }, [isClient, segments, incidents, vehicles, safeHubs, healthFacilities, missions, selectedSegment, selectedVehicleId, setSelectedSegment, onSelectSegment, onSelectVehicle]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-md border border-slate-200">
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="bg-slate-100 flex items-center justify-center">
        {!isClient && <span className="text-xs text-slate-400">Loading GIS Map...</span>}
      </div>

      {/* Map Legend matching exact prompt specifications */}
      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-300 shadow-lg text-[11px] z-[1000] max-w-[230px]">
        <div className="font-bold text-slate-800 mb-1 border-b border-slate-200 pb-1">Corridor Map Legend</div>
        <div className="space-y-1 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#10b981] rounded inline-block"></span>
            <span>Green: Open road</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#f59e0b] rounded inline-block"></span>
            <span>Yellow: Restricted road</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#ef4444] rounded inline-block"></span>
            <span>Red: Blocked road</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#6b7280] rounded inline-block"></span>
            <span>Grey: Unknown / stale road</span>
          </div>
          <div className="flex items-center gap-2 pt-0.5 border-t border-slate-100">
            <span className="w-3.5 h-1.5 bg-[#2563eb] rounded inline-block"></span>
            <span>Blue: Active assigned route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#059669] rounded inline-block"></span>
            <span>Green route: Recommended alt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#dc2626] border-dashed border-[#dc2626] inline-block"></span>
            <span>Dashed red: Blocked route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

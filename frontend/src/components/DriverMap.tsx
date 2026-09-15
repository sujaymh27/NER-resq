'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useResQ } from '../lib/resqContext';
import 'leaflet/dist/leaflet.css';

interface DriverMapProps {
  height?: string;
}

export const DriverMap: React.FC<DriverMapProps> = ({ height = '320px' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  const {
    vehicles,
    missions,
    segments,
    incidents,
    useDeviceGps
  } = useResQ();

  const vehicle = vehicles.find(v => v.vehicle_id === 'V-001') || vehicles[0];
  const mission = missions.find(m => m.mission_id === 'M-001') || missions[0];

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Driver Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const centerLat = vehicle?.latitude || 25.44;
        const centerLon = vehicle?.longitude || 91.80;

        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLon],
          zoom: 12,
          zoomControl: false,
          scrollWheelZoom: true,
          attributionControl: false
        });

        // Add subtle zoom control at bottom right
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
  }, [isClient]);

  // Update Driver Map Layers
  useEffect(() => {
    if (!isClient) return;

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    import('leaflet').then((L) => {
      layerGroup.clearLayers();

      const isRouteB = mission?.current_route?.includes('R-003-ALT');

      // 1. Draw Active Blue Route Line
      const routeSegmentIds = isRouteB
        ? ['R-001', 'R-002', 'R-003-ALT', 'R-005']
        : ['R-001', 'R-002', 'R-003', 'R-004', 'R-005'];

      const allRouteCoords: [number, number][] = [];
      routeSegmentIds.forEach(segId => {
        const seg = segments.find(s => s.segment_id === segId);
        if (seg?.coordinates) {
          allRouteCoords.push(...seg.coordinates);
        }
      });

      if (allRouteCoords.length > 1) {
        // Outer glow
        const glowLine = L.polyline(allRouteCoords, {
          color: '#3b82f6',
          weight: 9,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round'
        });
        layerGroup.addLayer(glowLine);

        // Core blue route line
        const blueLine = L.polyline(allRouteCoords, {
          color: '#1d4ed8',
          weight: 5,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        });
        blueLine.bindTooltip(
          `Assigned Route: ${isRouteB ? 'Route B (Umtyngar Bypass)' : 'Route A (Direct Highway)'}`,
          { sticky: true }
        );
        layerGroup.addLayer(blueLine);
      }

      // 2. Draw Blocked Road Marker (if R-004 is blocked)
      const r004 = segments.find(s => s.segment_id === 'R-004');
      if (r004?.coordinates && r004.road_status === 'blocked') {
        const blockedLine = L.polyline(r004.coordinates, {
          color: '#ef4444',
          weight: 6,
          opacity: 0.9,
          dashArray: '6, 8',
          lineCap: 'round',
          lineJoin: 'round'
        });
        blockedLine.bindTooltip('⛔ R-004 BLOCKED (Landslide)', { sticky: true });
        layerGroup.addLayer(blockedLine);

        // Blocked icon on R-004 midpoint
        const midIdx = Math.floor(r004.coordinates.length / 2);
        const midCoord = r004.coordinates[midIdx];
        const blockHtml = `
          <div style="
            background: #dc2626;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.35);
          ">⛔</div>
        `;
        const blockIcon = L.divIcon({
          className: 'driver-block-icon',
          html: blockHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const blockMarker = L.marker(midCoord, { icon: blockIcon });
        blockMarker.bindPopup('<b>⛔ Road Blocked</b><br/>R-004 Hairpin bends impassable for trucks.');
        layerGroup.addLayer(blockMarker);
      }

      // 3. Draw Road-Risk Markers
      incidents.forEach(inc => {
        if (inc.severity === 'high' || inc.severity === 'critical') {
          const riskHtml = `
            <div style="
              background: #f59e0b;
              color: #ffffff;
              border: 2px solid #ffffff;
              border-radius: 50%;
              width: 26px;
              height: 26px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              box-shadow: 0 3px 5px rgba(0,0,0,0.3);
            ">⚠️</div>
          `;
          const riskIcon = L.divIcon({
            className: 'driver-risk-icon',
            html: riskHtml,
            iconSize: [26, 26],
            iconAnchor: [13, 13]
          });
          const riskMarker = L.marker([inc.latitude, inc.longitude], { icon: riskIcon });
          riskMarker.bindPopup(`<b>⚠️ Road Warning</b><br/>${inc.description}`);
          layerGroup.addLayer(riskMarker);
        }
      });

      // 4. Starting-Point Marker (Origin)
      const originLat = mission?.origin_lat || 25.5600;
      const originLon = mission?.origin_lon || 91.8700;
      const startHtml = `
        <div style="
          background: #10b981;
          color: white;
          border: 2px solid white;
          border-radius: 8px;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        ">
          🟢 START: ${mission?.origin || 'Shillong'}
        </div>
      `;
      const startIcon = L.divIcon({
        className: 'driver-start-icon',
        html: startHtml,
        iconSize: [110, 24],
        iconAnchor: [55, 12]
      });
      const startMarker = L.marker([originLat, originLon], { icon: startIcon });
      layerGroup.addLayer(startMarker);

      // 5. Destination Marker
      const destLat = mission?.destination_lat || 25.2913;
      const destLon = mission?.destination_lon || 91.7210;
      const destHtml = `
        <div style="
          background: #dc2626;
          color: white;
          border: 2px solid white;
          border-radius: 8px;
          padding: 3px 6px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        ">
          🏥 DEST: ${mission?.destination || 'Sohra'}
        </div>
      `;
      const destIcon = L.divIcon({
        className: 'driver-dest-icon',
        html: destHtml,
        iconSize: [110, 24],
        iconAnchor: [55, 12]
      });
      const destMarker = L.marker([destLat, destLon], { icon: destIcon });
      layerGroup.addLayer(destMarker);

      // 6. Current Driver Location Marker (Vehicle)
      if (vehicle) {
        const vehHtml = `
          <div style="
            position: relative;
            background: #1e3a8a;
            border: 3px solid #60a5fa;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 0 16px #2563eb;
            animation: pulse 1.8s infinite;
          ">
            🚚
          </div>
        `;
        const vehIcon = L.divIcon({
          className: 'driver-loc-icon',
          html: vehHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        const driverMarker = L.marker([vehicle.latitude, vehicle.longitude], {
          icon: vehIcon,
          zIndexOffset: 2000
        });
        driverMarker.bindTooltip(`<b>Your Location</b><br/>${vehicle.current_segment_id} • ${vehicle.speed_kmh} km/h`, {
          permanent: false,
          direction: 'top'
        });
        layerGroup.addLayer(driverMarker);

        // Smoothly pan map to follow driver
        map.panTo([vehicle.latitude, vehicle.longitude], { animate: true, duration: 1.0 });
      }
    });
  }, [isClient, vehicle?.latitude, vehicle?.longitude, vehicle?.speed_kmh, mission?.current_route, segments, incidents]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-inner border border-slate-300 bg-slate-100">
      <div ref={mapContainerRef} style={{ width: '100%', height }} />

      {/* Simulated Location / GPS indicator badge */}
      <div className="absolute top-2 left-2 bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[10px] font-bold z-[1000] border border-slate-700 flex items-center gap-1.5 shadow">
        <span className={`w-2 h-2 rounded-full ${useDeviceGps ? 'bg-emerald-400' : 'bg-blue-400 animate-ping'}`} />
        <span>{useDeviceGps ? 'Live Device GPS Active' : 'Demo live tracking — simulated location'}</span>
      </div>

      {/* Compact Route pill */}
      <div className="absolute top-2 right-2 bg-blue-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[10px] font-bold z-[1000] shadow flex items-center gap-1">
        <span>Route:</span>
        <span className="font-mono">{mission?.current_route?.includes('R-003-ALT') ? 'Route B' : 'Route A'}</span>
      </div>
    </div>
  );
};

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  RoadSegment,
  Incident,
  FieldReport,
  Vehicle,
  Mission,
  SafeHub,
  HealthFacility,
  DecisionEvent,
  UserRole,
  NetworkState,
  SyncStatus,
  RouteEvaluationResult,
  RiskEvaluationResult
} from '../types/resq';
import {
  INITIAL_SEGMENTS,
  INITIAL_INCIDENTS,
  INITIAL_FIELD_REPORTS,
  INITIAL_VEHICLES,
  INITIAL_MISSIONS,
  INITIAL_SAFE_HUBS,
  INITIAL_FACILITIES,
  INITIAL_EVENTS
} from '../data/initialData';
import { api } from './api';

export interface DriverAlertState {
  show: boolean;
  title: string;
  roadName: string;
  routeBypass: string;
  delayText: string;
  distanceAhead: string;
  acknowledged: boolean;
  reminderCount: number;
}

export interface StartMissionParams {
  driverName: string;
  vehicleNumber: string;
  fromLocation: string;
  toDestination: string;
  cargoType: string;
  missionPriority: 'critical' | 'high' | 'medium' | 'low';
  assignedRoute: string;
}

export const ROUTE_A_WAYPOINTS = [
  { lat: 25.5600, lon: 91.8700, segment: 'R-001', distanceRemaining: 54.0, eta: '2 hr 10 min', speed: 38 },
  { lat: 25.5350, lon: 91.8550, segment: 'R-001', distanceRemaining: 48.0, eta: '1 hr 55 min', speed: 44 },
  { lat: 25.5050, lon: 91.8400, segment: 'R-002', distanceRemaining: 41.5, eta: '1 hr 40 min', speed: 42 },
  { lat: 25.4700, lon: 91.8300, segment: 'R-002', distanceRemaining: 35.0, eta: '1 hr 25 min', speed: 40 },
  { lat: 25.4350, lon: 91.8150, segment: 'R-003', distanceRemaining: 29.2, eta: '1 hr 10 min', speed: 36 },
  { lat: 25.4150, lon: 91.7950, segment: 'R-003', distanceRemaining: 24.8, eta: '58 min', speed: 32 },
  { lat: 25.3950, lon: 91.7800, segment: 'R-004', distanceRemaining: 19.5, eta: '45 min', speed: 34 },
  { lat: 25.3550, lon: 91.7500, segment: 'R-004', distanceRemaining: 14.0, eta: '32 min', speed: 36 },
  { lat: 25.3200, lon: 91.7350, segment: 'R-005', distanceRemaining: 7.5, eta: '18 min', speed: 40 },
  { lat: 25.2913, lon: 91.7210, segment: 'R-005', distanceRemaining: 0.0, eta: 'Arrived', speed: 0 }
];

export const ROUTE_B_WAYPOINTS = [
  { lat: 25.4700, lon: 91.8300, segment: 'R-002', distanceRemaining: 38.0, eta: '1 hr 35 min', speed: 38 },
  { lat: 25.4600, lon: 91.8350, segment: 'R-003-ALT', distanceRemaining: 32.5, eta: '1 hr 20 min', speed: 35 },
  { lat: 25.4200, lon: 91.8100, segment: 'R-003-ALT', distanceRemaining: 26.0, eta: '1 hr 05 min', speed: 36 },
  { lat: 25.3700, lon: 91.7700, segment: 'R-003-ALT', distanceRemaining: 19.2, eta: '48 min', speed: 38 },
  { lat: 25.3375, lon: 91.7352, segment: 'R-005', distanceRemaining: 10.5, eta: '25 min', speed: 40 },
  { lat: 25.2913, lon: 91.7210, segment: 'R-005', distanceRemaining: 0.0, eta: 'Arrived', speed: 0 }
];

interface ResQContextType {
  segments: RoadSegment[];
  incidents: Incident[];
  fieldReports: FieldReport[];
  vehicles: Vehicle[];
  missions: Mission[];
  safeHubs: SafeHub[];
  healthFacilities: HealthFacility[];
  decisionEvents: DecisionEvent[];
  activeRole: UserRole;
  networkState: NetworkState;
  isMobileFrame: boolean;
  activeAlert: DriverAlertState;
  currentDemoStep: number;
  isTourActive: boolean;
  selectedSegment: RoadSegment | null;
  selectedReport: FieldReport | null;
  selectedRole: UserRole | null;
  cargoStagedAtHub: boolean;
  backendOnline: boolean;

  // Live Location & Tracking
  simulationIndex: number;
  useDeviceGps: boolean;
  setUseDeviceGps: (val: boolean) => void;
  selectedDriverVehicle: Vehicle | null;
  setSelectedDriverVehicle: (veh: Vehicle | null) => void;

  // Actions
  setSelectedRole: (role: UserRole | null) => void;
  setActiveRole: (role: UserRole) => void;
  setNetworkState: (state: NetworkState) => void;
  setIsMobileFrame: (val: boolean) => void;
  setSelectedSegment: (seg: RoadSegment | null) => void;
  setSelectedReport: (rep: FieldReport | null) => void;
  
  // Operational actions
  startMission: (params: StartMissionParams) => void;
  pauseMission: () => void;
  resumeMission: () => void;
  reportDriverProblem: (issueType: string, description: string) => void;
  escalateMission: (missionId?: string, reason?: string) => void;
  sendDistrictAlert: (alert: { title: string; roadName?: string; routeBypass?: string; delayText?: string; message?: string }) => void;
  saveOfflineReport: (report: Partial<FieldReport>) => FieldReport;
  syncOfflineReports: () => void;
  verifyReport: (reportId: string, action: 'verify' | 'reject' | 'request_field_check' | 'override', notes: string) => void;
  rerouteMission: (missionId: string, newRoute: string, delayMinutes: number, alertMsg: string) => void;
  acknowledgeDriverAlert: () => void;
  completeMission: (missionId: string) => void;
  stageCargoAtHub: (hubId: string) => void;
  
  // 12-Step Scenario Controller & Edge Cases
  setDemoStep: (step: number) => void;
  nextDemoStep: () => void;
  prevDemoStep: () => void;
  triggerEdgeCase: (edgeCaseId: number) => void;
  resetCorridorState: () => void;
}

const ResQContext = createContext<ResQContextType | undefined>(undefined);

export const ResQProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [segments, setSegments] = useState<RoadSegment[]>(INITIAL_SEGMENTS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [fieldReports, setFieldReports] = useState<FieldReport[]>(INITIAL_FIELD_REPORTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [safeHubs, setSafeHubs] = useState<SafeHub[]>(INITIAL_SAFE_HUBS);
  const [healthFacilities, setHealthFacilities] = useState<HealthFacility[]>(INITIAL_FACILITIES);
  const [decisionEvents, setDecisionEvents] = useState<DecisionEvent[]>(INITIAL_EVENTS);

  const [activeRole, setActiveRole] = useState<UserRole>('driver');
  const [selectedRole, setSelectedRoleState] = useState<UserRole | null>(null);
  const [networkState, setNetworkState] = useState<NetworkState>('online');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  const setSelectedRole = useCallback((role: UserRole | null) => {
    setSelectedRoleState(role);
    if (role) {
      setActiveRole(role);
      if (role === 'driver' || role === 'field_officer') {
        setIsMobileFrame(true);
      } else {
        setIsMobileFrame(false);
      }
    }
  }, []);
  const [currentDemoStep, setCurrentDemoStep] = useState<number>(1);
  const [isTourActive, setIsTourActive] = useState<boolean>(false);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [selectedReport, setSelectedReport] = useState<FieldReport | null>(null);
  const [cargoStagedAtHub, setCargoStagedAtHub] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);

  // Live Location Simulation & Tracking States
  const [simulationIndex, setSimulationIndex] = useState<number>(0);
  const [useDeviceGps, setUseDeviceGps] = useState<boolean>(false);
  const [selectedDriverVehicle, setSelectedDriverVehicle] = useState<Vehicle | null>(null);

  const [activeAlert, setActiveAlert] = useState<DriverAlertState>({
    show: false,
    title: 'ROAD BLOCKED AHEAD — 2 KM',
    roadName: 'R-004 Mawkdok to Sohra Approach',
    routeBypass: 'TAKE ROUTE B (VIA UMTYNGAR BYPASS)',
    delayText: 'NEW DELAY: +25 MINUTES',
    distanceAhead: '2.4 KM',
    acknowledged: false,
    reminderCount: 0
  });

  // Check backend connectivity on mount
  useEffect(() => {
    let mounted = true;
    api.checkHealth().then(healthy => {
      if (mounted) {
        setBackendOnline(healthy);
        if (healthy) {
          api.getDecisionEvents().then(evts => {
            if (mounted && evts && evts.length > 0) {
              // Merge backend events with local events if desired
            }
          });
        }
      }
    });
    return () => { mounted = false; };
  }, []);

  const addDecisionEvent = useCallback((type: string, actor: string, desc: string, data?: any) => {
    const newEvt: DecisionEvent = {
      event_id: `EVT-${String(decisionEvents.length + 1).padStart(3, '0')}`,
      mission_id: 'M-001',
      event_type: type,
      actor_role: actor,
      event_description: desc,
      timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      event_data: JSON.stringify(data || {})
    };
    setDecisionEvents(prev => [newEvt, ...prev]);
  }, [decisionEvents.length]);

  // Save report (offline or online)
  const saveOfflineReport = useCallback((partial: Partial<FieldReport>): FieldReport => {
    const newId = partial.report_id || `FR-${String(fieldReports.length + 1).padStart(3, '0')}`;
    const isOffline = networkState === 'offline';
    const status: SyncStatus = isOffline ? 'saved_locally' : (partial.photo_attached ? 'photo_pending' : 'sent');

    const newRep: FieldReport = {
      report_id: newId,
      incident_id: `INC-${String(incidents.length + 1).padStart(3, '0')}`,
      reporter_id: 'FO-021',
      reporter_role: 'field_officer',
      segment_id: partial.segment_id || 'R-004',
      latitude: partial.latitude || 25.3376,
      longitude: partial.longitude || 91.7351,
      reported_at_local: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reported_at_utc: new Date().toISOString(),
      gps_accuracy_meters: partial.gps_accuracy_meters ?? 8,
      incident_type: partial.incident_type || 'landslide',
      road_status_reported: partial.road_status_reported || 'blocked',
      truck_access_reported: partial.truck_access_reported || 'blocked',
      motorcycle_access_reported: partial.motorcycle_access_reported || 'open',
      bus_access_reported: partial.bus_access_reported || 'blocked',
      emergency_access_reported: partial.emergency_access_reported || 'restricted',
      severity: partial.severity || 'critical',
      photo_attached: partial.photo_attached !== undefined ? partial.photo_attached : true,
      photo_url: partial.photo_url,
      description: partial.description || 'Major slide covering truck lanes; shoulder narrow.',
      network_status_at_submission: networkState,
      sync_status: status,
      verification_status: 'pending',
      data_source: 'field_report_demo'
    };

    setFieldReports(prev => {
      const filtered = prev.filter(r => r.report_id !== newId);
      return [newRep, ...filtered];
    });

    // If online, dispatch asynchronously to backend
    if (!isOffline) {
      api.submitFieldReport({
        report_id: newRep.report_id,
        reporter_id: newRep.reporter_id,
        reporter_role: newRep.reporter_role,
        segment_id: newRep.segment_id,
        latitude: newRep.latitude,
        longitude: newRep.longitude,
        gps_accuracy_meters: newRep.gps_accuracy_meters,
        incident_type: newRep.incident_type,
        road_status_reported: newRep.road_status_reported,
        truck_access_reported: newRep.truck_access_reported,
        motorcycle_access_reported: newRep.motorcycle_access_reported,
        bus_access_reported: newRep.bus_access_reported,
        emergency_access_reported: newRep.emergency_access_reported,
        severity: newRep.severity,
        photo_attached: newRep.photo_attached,
        description: newRep.description,
        network_status_at_submission: newRep.network_status_at_submission,
        sync_status: newRep.sync_status
      }).catch(err => console.warn('Online field report dispatch fallback:', err));
    }

    addDecisionEvent(
      isOffline ? 'OFFLINE_REPORT_QUEUED' : 'REPORT_SUBMITTED',
      'field_officer',
      `Report ${newId} for ${newRep.segment_id} created (${newRep.sync_status})`,
      { report_id: newId, status: newRep.sync_status, network: networkState }
    );
    return newRep;
  }, [fieldReports.length, incidents.length, networkState, addDecisionEvent]);

  // Sync reports when network returns
  const syncOfflineReports = useCallback(() => {
    setFieldReports(prev => {
      const updated = prev.map(r => {
        if (r.sync_status === 'saved_locally' || r.sync_status === 'waiting_network') {
          // Send to backend
          api.submitFieldReport({
            report_id: r.report_id,
            reporter_id: r.reporter_id,
            reporter_role: r.reporter_role,
            segment_id: r.segment_id,
            latitude: r.latitude,
            longitude: r.longitude,
            gps_accuracy_meters: r.gps_accuracy_meters,
            incident_type: r.incident_type,
            road_status_reported: r.road_status_reported,
            truck_access_reported: r.truck_access_reported,
            motorcycle_access_reported: r.motorcycle_access_reported,
            bus_access_reported: r.bus_access_reported,
            emergency_access_reported: r.emergency_access_reported,
            severity: r.severity,
            photo_attached: r.photo_attached,
            description: r.description,
            network_status_at_submission: 'online',
            sync_status: 'synced'
          }).catch(err => console.warn('Sync report fallback:', err));

          return {
            ...r,
            sync_status: (r.photo_attached ? 'photo_pending' : 'sent') as SyncStatus,
            submitted_to_server_at_utc: new Date().toISOString()
          };
        }
        return r;
      });
      return updated;
    });

    addDecisionEvent(
      'REPORT_SYNCHRONIZED',
      'system',
      'Offline field reports synchronized to central command database.',
      { synced_count: fieldReports.filter(r => r.sync_status === 'saved_locally').length }
    );
  }, [fieldReports, addDecisionEvent]);

  // Verify / Reject report by District Officer
  const verifyReport = useCallback((reportId: string, action: 'verify' | 'reject' | 'request_field_check' | 'override', notes: string) => {
    const report = fieldReports.find(r => r.report_id === reportId);
    if (!report) return;

    setFieldReports(prev =>
      prev.map(r =>
        r.report_id === reportId
          ? {
              ...r,
              verification_status: action === 'verify' ? 'verified' : action === 'reject' ? 'rejected' : action === 'override' ? 'officer_override' : 'needs_field_check',
              reviewed_by: 'District Officer (DEOC)',
              review_notes: notes,
              sync_status: 'verified'
            }
          : r
      )
    );

    // Call backend
    api.verifyFieldReport(reportId, action, notes, action === 'verify').catch(err => console.warn('Verify backend fallback:', err));

    if (action === 'verify') {
      const segId = report.segment_id;
      setSegments(prev =>
        prev.map(s => {
          if (s.segment_id === segId) {
            return {
              ...s,
              road_status: report.road_status_reported,
              truck_access: report.truck_access_reported,
              motorcycle_access: report.motorcycle_access_reported,
              bus_access: report.bus_access_reported,
              risk_level: 'critical',
              risk_score: 86,
              confidence_score: 91,
              data_source: 'officer_verified_demo',
              notes: `Officer Verified: ${notes}`,
              last_updated_utc: new Date().toISOString()
            };
          }
          return s;
        })
      );

      // Create or update active incident
      const newInc: Incident = {
        incident_id: `INC-${segId}-ACT`,
        segment_id: segId,
        incident_type: report.incident_type,
        latitude: report.latitude,
        longitude: report.longitude,
        severity: report.severity,
        reported_at_utc: new Date().toISOString(),
        vehicle_impact: 'trucks_blocked_motorcycles_open',
        description: report.description,
        photo_available: report.photo_attached,
        verification_status: 'verified',
        reported_by_role: 'district_officer',
        data_source: 'officer_verified_demo'
      };
      setIncidents(prev => [newInc, ...prev.filter(i => i.incident_id !== newInc.incident_id)]);

      addDecisionEvent(
        'REPORT_VERIFIED',
        'district_officer',
        `District Officer verified ${reportId}. Road ${segId} blocked for trucks.`,
        { segment: segId, action, notes }
      );
    }
  }, [fieldReports, addDecisionEvent]);

  // Reroute mission & dispatch driver alert
  const rerouteMission = useCallback((missionId: string, newRoute: string, delayMinutes: number, alertMsg: string) => {
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === missionId
          ? {
              ...m,
              current_route: newRoute,
              delay_minutes: delayMinutes,
              mission_status: 'rerouted',
              planned_eta_utc: '1:05 PM',
              current_eta_utc: '1:05 PM',
              last_action: `Rerouted to ${newRoute} (+${delayMinutes} min). Alert: ${alertMsg}`
            }
          : m
      )
    );

    setVehicles(prev =>
      prev.map(v =>
        v.mission_id === missionId
          ? {
              ...v,
              mission_status: 'rerouted',
              current_segment_id: 'R-003-ALT'
            }
          : v
      )
    );

    setActiveAlert({
      show: true,
      title: 'ROAD BLOCKED AHEAD — 2 KM',
      roadName: 'R-004 Mawkdok to Sohra Approach',
      routeBypass: 'TAKE ROUTE B (VIA UMTYNGAR BYPASS)',
      delayText: `NEW DELAY: +${delayMinutes} MINUTES`,
      distanceAhead: '2.4 KM',
      acknowledged: false,
      reminderCount: 0
    });

    // Call backend API
    api.rerouteMission(missionId, newRoute, delayMinutes, alertMsg).catch(err => console.warn('Reroute backend fallback:', err));

    addDecisionEvent(
      'DRIVER_ALERT_DISPATCHED',
      'district_officer',
      `Reroute alert sent to driver for mission ${missionId}: ${alertMsg}`,
      { mission: missionId, route: newRoute, delay: delayMinutes }
    );
  }, [addDecisionEvent]);

  // Acknowledge driver alert
  const acknowledgeDriverAlert = useCallback(() => {
    setActiveAlert(prev => ({ ...prev, show: false, acknowledged: true }));
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === 'M-001'
          ? {
              ...m,
              last_action: 'Driver acknowledged reroute alert. Following Route B.'
            }
          : m
      )
    );

    // Advance vehicle position on Route B
    setVehicles(prev =>
      prev.map(v =>
        v.vehicle_id === 'V-001'
          ? {
              ...v,
              current_segment_id: 'R-003-ALT',
              latitude: 25.4200,
              longitude: 91.8100,
              speed_kmh: 36
            }
          : v
      )
    );

    // Call backend
    api.acknowledgeDriverAlert('V-001', 'M-001').catch(err => console.warn('Acknowledge backend fallback:', err));

    addDecisionEvent(
      'DRIVER_ALERT_ACKNOWLEDGED',
      'driver',
      'Driver Bah Daplin Nongrum acknowledged reroute instructions. Proceeding on Route B.',
      { vehicle: 'V-001', mission: 'M-001' }
    );
  }, [addDecisionEvent]);

  // Start new mission from Driver Form
  const startMission = useCallback((params: StartMissionParams) => {
    const isRouteB = params.assignedRoute?.includes('Route B') || params.assignedRoute?.includes('R-003-ALT');
    const routeCode = isRouteB ? 'R-001>R-002>R-003-ALT>R-005' : 'R-001>R-002>R-003>R-004>R-005';
    const originLat = 25.5600;
    const originLon = 91.8700;

    setSimulationIndex(0);

    setMissions(prev =>
      prev.map(m =>
        m.mission_id === 'M-001'
          ? {
              ...m,
              driver_name: params.driverName,
              vehicle_number: params.vehicleNumber,
              origin: params.fromLocation,
              destination: params.toDestination,
              cargo_type: params.cargoType,
              cargo_priority: params.missionPriority,
              current_route: routeCode,
              mission_status: 'In Transit',
              distance_remaining_km: 54.0,
              current_eta_utc: '2 hr 10 min',
              delay_minutes: 0,
              last_action: `Mission started by ${params.driverName}. Status: In Transit.`
            }
          : m
      )
    );

    setVehicles(prev =>
      prev.map(v =>
        v.vehicle_id === 'V-001'
          ? {
              ...v,
              driver_name: params.driverName,
              origin: params.fromLocation,
              destination: params.toDestination,
              current_segment_id: 'R-001',
              latitude: originLat,
              longitude: originLon,
              speed_kmh: 38,
              last_seen_utc: 'Just now',
              mission_status: 'In Transit',
              cargo_type: params.cargoType,
              cargo_priority: params.missionPriority
            }
          : v
      )
    );

    addDecisionEvent(
      'MISSION_STARTED',
      'driver',
      `Driver ${params.driverName} (${params.vehicleNumber}) started mission from ${params.fromLocation} to ${params.toDestination}. Cargo: ${params.cargoType}. Status: In Transit.`,
      { driver: params.driverName, vehicle: params.vehicleNumber, from: params.fromLocation, to: params.toDestination }
    );
  }, [addDecisionEvent]);

  // Pause mission
  const pauseMission = useCallback(() => {
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === 'M-001'
          ? {
              ...m,
              mission_status: 'Paused',
              last_action: 'Mission paused by driver.'
            }
          : m
      )
    );
    setVehicles(prev =>
      prev.map(v =>
        v.vehicle_id === 'V-001'
          ? {
              ...v,
              mission_status: 'Paused',
              speed_kmh: 0
            }
          : v
      )
    );
    addDecisionEvent('MISSION_PAUSED', 'driver', 'Driver paused active transit.');
  }, [addDecisionEvent]);

  // Resume mission
  const resumeMission = useCallback(() => {
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === 'M-001'
          ? {
              ...m,
              mission_status: 'In Transit',
              last_action: 'Mission resumed by driver.'
            }
          : m
      )
    );
    setVehicles(prev =>
      prev.map(v =>
        v.vehicle_id === 'V-001'
          ? {
              ...v,
              mission_status: 'In Transit',
              speed_kmh: 38
            }
          : v
      )
    );
    addDecisionEvent('MISSION_RESUMED', 'driver', 'Driver resumed active transit.');
  }, [addDecisionEvent]);

  // Report problem from driver
  const reportDriverProblem = useCallback((issueType: string, description: string) => {
    const curVeh = vehicles.find(v => v.vehicle_id === 'V-001') || vehicles[0];
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === 'M-001'
          ? {
              ...m,
              mission_status: 'At Risk',
              last_action: `Driver reported issue: ${issueType}. ${description}`
            }
          : m
      )
    );
    setVehicles(prev =>
      prev.map(v =>
        v.vehicle_id === 'V-001'
          ? {
              ...v,
              mission_status: 'At Risk',
              speed_kmh: 15
            }
          : v
      )
    );

    saveOfflineReport({
      reporter_role: 'driver',
      segment_id: curVeh.current_segment_id,
      latitude: curVeh.latitude,
      longitude: curVeh.longitude,
      incident_type: (issueType.toLowerCase().includes('slide') ? 'landslide' : issueType.toLowerCase().includes('tree') ? 'fallen_tree' : 'road_damage') as any,
      road_status_reported: 'restricted',
      severity: 'high',
      description: `[Driver Report] ${issueType}: ${description}`
    });

    addDecisionEvent(
      'DRIVER_PROBLEM_REPORTED',
      'driver',
      `Driver reported road issue on ${curVeh.current_segment_id}: ${issueType} - ${description}. Mission set to At Risk.`,
      { segment: curVeh.current_segment_id, issueType, description }
    );
  }, [vehicles, saveOfflineReport, addDecisionEvent]);

  // Escalate mission
  const escalateMission = useCallback((missionId: string = 'M-001', reason: string = 'Critical corridor hazard / delay') => {
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === missionId
          ? {
              ...m,
              mission_status: 'Escalated',
              last_action: `Mission ESCALATED by District Officer. Reason: ${reason}`
            }
          : m
      )
    );
    setVehicles(prev =>
      prev.map(v =>
        v.mission_id === missionId
          ? {
              ...v,
              mission_status: 'Escalated'
            }
          : v
      )
    );
    addDecisionEvent(
      'MISSION_ESCALATED',
      'district_officer',
      `District Officer escalated mission ${missionId}. State Operations alerted. Reason: ${reason}`,
      { mission_id: missionId, reason }
    );
  }, [addDecisionEvent]);

  // Send district alert to driver
  const sendDistrictAlert = useCallback((alertData: { title: string; roadName?: string; routeBypass?: string; delayText?: string; message?: string }) => {
    setActiveAlert({
      show: true,
      title: alertData.title || 'ROAD BLOCKED AHEAD',
      roadName: alertData.roadName || 'R-004 Mawkdok to Sohra Approach',
      routeBypass: alertData.routeBypass || 'Stop safely and follow Route B.',
      delayText: alertData.delayText || 'Additional delay: 25 minutes.',
      distanceAhead: '2.4 KM',
      acknowledged: false,
      reminderCount: 0
    });
    addDecisionEvent(
      'ALERT_SENT_TO_DRIVER',
      'district_officer',
      `District Officer sent alert: ${alertData.title}. ${alertData.routeBypass || alertData.message || ''}`,
      alertData
    );
  }, [addDecisionEvent]);

  // Simulated Live Location Movement Interval
  useEffect(() => {
    const activeMission = missions.find(m => m.mission_id === 'M-001');
    if (!activeMission) return;

    const isMoving = activeMission.mission_status === 'In Transit' || activeMission.mission_status === 'in_transit' || activeMission.mission_status === 'Rerouted' || activeMission.mission_status === 'rerouted';

    if (!isMoving || useDeviceGps) return;

    const interval = setInterval(() => {
      const isRouteB = activeMission.current_route?.includes('R-003-ALT');
      const waypoints = isRouteB ? ROUTE_B_WAYPOINTS : ROUTE_A_WAYPOINTS;

      setSimulationIndex(prevIdx => {
        const nextIdx = prevIdx + 1;
        if (nextIdx >= waypoints.length) {
          const lastWp = waypoints[waypoints.length - 1];
          setVehicles(prevVehs =>
            prevVehs.map(v =>
              v.vehicle_id === 'V-001'
                ? {
                    ...v,
                    latitude: lastWp.lat,
                    longitude: lastWp.lon,
                    current_segment_id: lastWp.segment,
                    speed_kmh: 0,
                    last_seen_utc: 'Just now'
                  }
                : v
            )
          );
          setMissions(prevM =>
            prevM.map(m =>
              m.mission_id === 'M-001'
                ? {
                    ...m,
                    distance_remaining_km: 0,
                    current_eta_utc: 'Arrived'
                  }
                : m
            )
          );
          return prevIdx;
        }

        const currentWp = waypoints[nextIdx];
        setVehicles(prevVehs =>
          prevVehs.map(v =>
            v.vehicle_id === 'V-001'
              ? {
                  ...v,
                  latitude: currentWp.lat,
                  longitude: currentWp.lon,
                  current_segment_id: currentWp.segment,
                  speed_kmh: currentWp.speed,
                  last_seen_utc: 'Just now'
                }
              : v
          )
        );

        setMissions(prevM =>
          prevM.map(m =>
            m.mission_id === 'M-001'
              ? {
                  ...m,
                  distance_remaining_km: currentWp.distanceRemaining,
                  current_eta_utc: currentWp.eta,
                  last_action: `In transit along ${currentWp.segment}`
                }
              : m
          )
        );

        return nextIdx;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, [missions, useDeviceGps]);

  // Real Device GPS Watcher
  useEffect(() => {
    if (!useDeviceGps || typeof window === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, speed } = pos.coords;
        setVehicles(prev =>
          prev.map(v =>
            v.vehicle_id === 'V-001'
              ? {
                  ...v,
                  latitude,
                  longitude,
                  speed_kmh: speed ? Math.round(speed * 3.6) : 35,
                  last_seen_utc: 'Just now'
                }
              : v
          )
        );
      },
      err => {
        console.warn('Device GPS unavailable, falling back to simulation:', err.message);
        setUseDeviceGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 3000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [useDeviceGps]);

  // Complete mission
  const completeMission = useCallback((missionId: string) => {
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === missionId
          ? {
              ...m,
              mission_status: 'Delivered',
              distance_remaining_km: 0,
              current_eta_utc: 'Delivered',
              last_action: 'Emergency medicine successfully delivered to Sohra Health Facility.'
            }
          : m
      )
    );

    setVehicles(prev =>
      prev.map(v =>
        v.mission_id === missionId
          ? {
              ...v,
              mission_status: 'Delivered',
              current_segment_id: 'R-005',
              latitude: 25.2913,
              longitude: 91.7210,
              speed_kmh: 0,
              last_seen_utc: 'Just now'
            }
          : v
      )
    );

    // Call backend
    api.completeMission('V-001', missionId).catch(err => console.warn('Complete mission backend fallback:', err));

    addDecisionEvent(
      'MISSION_COMPLETED',
      'driver',
      'Delivery Completed: Medicine safely received by Chief Medical Officer at Sohra Health Facility.',
      { mission: missionId, vehicle: 'V-001' }
    );
  }, [addDecisionEvent]);

  // Stage cargo at safe hub
  const stageCargoAtHub = useCallback((hubId: string) => {
    setCargoStagedAtHub(true);
    setMissions(prev =>
      prev.map(m =>
        m.mission_id === 'M-001'
          ? {
              ...m,
              mission_status: 'staged',
              last_action: `Cargo staged at ${hubId}. Safe-hub cargo transfer to motorcycle courier in progress.`
            }
          : m
      )
    );

    setVehicles(prev =>
      prev.map(v =>
        v.vehicle_id === 'V-001'
          ? {
              ...v,
              mission_status: 'staged',
              current_segment_id: 'R-003',
              latitude: 25.4315,
              longitude: 91.7910,
              speed_kmh: 0
            }
          : v
      )
    );

    addDecisionEvent(
      'CARGO_STAGED_AT_SAFE_HUB',
      'district_officer',
      `All truck routes impassable. Cargo staged at Safe Hub ${hubId}. Initiating motorcycle courier relay.`,
      { hub_id: hubId, vehicle: 'V-001' }
    );
  }, [addDecisionEvent]);

  // 12-Step Scenario Controller
  const executeDemoStepState = useCallback((step: number) => {
    switch (step) {
      case 1:
        // Step 1: Driver starts a medicine mission from Shillong to Sohra
        setActiveRole('driver');
        setIsMobileFrame(true);
        setNetworkState('online');
        setMissions(prev => prev.map(m => m.mission_id === 'M-001' ? {
          ...m,
          mission_status: 'in_transit',
          current_route: 'R-001>R-002>R-003>R-004>R-005',
          delay_minutes: 0,
          current_eta_utc: '12:40 PM',
          last_action: 'Vehicle departed Shillong Logistics Gate with critical medicine cargo.'
        } : m));
        setVehicles(prev => prev.map(v => v.vehicle_id === 'V-001' ? {
          ...v,
          mission_status: 'in_transit',
          current_segment_id: 'R-002',
          latitude: 25.5100,
          longitude: 91.8500,
          speed_kmh: 42
        } : v));
        setActiveAlert({
          show: false,
          title: 'ROAD BLOCKED AHEAD — 2 KM',
          roadName: 'R-004 Mawkdok to Sohra Approach',
          routeBypass: 'TAKE ROUTE B (VIA UMTYNGAR BYPASS)',
          delayText: 'NEW DELAY: +25 MINUTES',
          distanceAhead: '2.4 KM',
          acknowledged: false,
          reminderCount: 0
        });
        addDecisionEvent(
          'MISSION_STARTED',
          'driver',
          'Driver Bah Daplin Nongrum departs Shillong on Mission M-001 (Insulin & Antibiotics for Sohra).',
          { origin: 'Shillong', destination: 'Sohra', route: 'Route A' }
        );
        break;

      case 2:
        // Step 2: Field officer saves a landslide report offline
        setActiveRole('field_officer');
        setIsMobileFrame(true);
        setNetworkState('offline');
        saveOfflineReport({
          report_id: 'FR-001',
          segment_id: 'R-004',
          latitude: 25.3376,
          longitude: 91.7351,
          incident_type: 'landslide',
          road_status_reported: 'blocked',
          truck_access_reported: 'blocked',
          motorcycle_access_reported: 'open',
          bus_access_reported: 'blocked',
          emergency_access_reported: 'restricted',
          severity: 'critical',
          photo_attached: true,
          description: 'Massive debris slide covering 35m of roadway. Truck lane completely obstructed; motorcycle shoulder passable with care.'
        });
        break;

      case 3:
        // Step 3: Report synchronizes after network restoration
        setActiveRole('field_officer');
        setIsMobileFrame(true);
        setNetworkState('online');
        syncOfflineReports();
        break;

      case 4:
        // Step 4: AI calculates high risk
        setActiveRole('district_officer');
        setIsMobileFrame(false);
        // Trigger risk computation on R-004
        setSegments(prev => prev.map(s => s.segment_id === 'R-004' ? {
          ...s,
          risk_score: 86,
          risk_level: 'critical',
          notes: 'AI Risk Engine: Critical 86/100 (Rainfall: 80, Steep Escarpment: 85, Ground-Truth Report: 90). Verification required.'
        } : s));
        api.evaluateRisk({
          rainfall_risk: 80,
          terrain_risk: 85,
          incident_history_risk: 75,
          field_report_risk: 90,
          road_condition_risk: 70
        }).catch(err => console.warn('AI risk engine fallback:', err));
        addDecisionEvent(
          'AI_HIGH_RISK_CALCULATED',
          'ai_risk_engine',
          'AI Risk Engine calculates Critical Risk (86/100) on R-004 based on rainfall, slope, and synced field observation.',
          { segment_id: 'R-004', risk_score: 86, risk_level: 'critical' }
        );
        break;

      case 5:
        // Step 5: District officer reviews the report and evidence
        setActiveRole('district_officer');
        setIsMobileFrame(false);
        setSelectedSegment(segments.find(s => s.segment_id === 'R-004') || null);
        setSelectedReport(fieldReports.find(r => r.segment_id === 'R-004') || fieldReports[0] || null);
        addDecisionEvent(
          'REPORT_REVIEW_OPENED',
          'district_officer',
          'District Officer inspects field report FR-001 and attached photographic evidence from FO-021 for segment R-004.',
          { report_id: 'FR-001', segment_id: 'R-004' }
        );
        break;

      case 6:
        // Step 6: District officer verifies truck blockage
        setActiveRole('district_officer');
        setIsMobileFrame(false);
        verifyReport('FR-001', 'verify', 'Visual confirmation from FO-021: Truck lanes buried by mud & boulders. Trucks blocked, motorcycles passable.');
        break;

      case 7:
        // Step 7: System selects an alternative route
        setActiveRole('district_officer');
        setIsMobileFrame(false);
        api.evaluateRoutes('medical_supply_truck', 'critical').catch(err => console.warn('Route engine fallback:', err));
        addDecisionEvent(
          'ALTERNATIVE_ROUTE_SELECTED',
          'route_engine',
          'System evaluates corridor routes: Route A rejected (R-004 blocked for trucks). Route B (Umtyngar Bypass) selected (+25 min delay).',
          { recommended_route: 'Route B', additional_delay_minutes: 25 }
        );
        break;

      case 8:
        // Step 8: Driver receives a short alert
        setActiveRole('driver');
        setIsMobileFrame(true);
        rerouteMission(
          'M-001',
          'R-001>R-002>R-003-ALT>R-005',
          25,
          'ROAD BLOCKED AHEAD (2.4 KM). TAKE ROUTE B (VIA UMTYNGAR BYPASS). DELAY: +25 MIN'
        );
        break;

      case 9:
        // Step 9: Driver acknowledges the alert
        setActiveRole('driver');
        setIsMobileFrame(true);
        acknowledgeDriverAlert();
        break;

      case 10:
        // Step 10: District officer sees the updated mission
        setActiveRole('district_officer');
        setIsMobileFrame(false);
        addDecisionEvent(
          'MISSION_STATUS_UPDATED',
          'district_officer',
          'District Officer observes live mission M-001 updated: Driver acknowledged alert and is advancing along Route B bypass.',
          { mission_id: 'M-001', status: 'rerouted', route: 'Route B' }
        );
        break;

      case 11:
        // Step 11: Driver completes the medicine delivery
        setActiveRole('driver');
        setIsMobileFrame(true);
        completeMission('M-001');
        break;

      case 12:
        // Step 12: Timeline records the complete process
        setActiveRole('district_officer');
        setIsMobileFrame(false);
        addDecisionEvent(
          'DECISION_AUDIT_VERIFIED',
          'system',
          'Complete 12-step emergency routing decision audit trail verified. All actions recorded immutably.',
          { total_events: decisionEvents.length + 1 }
        );
        break;

      default:
        break;
    }
  }, [segments, fieldReports, decisionEvents.length, saveOfflineReport, syncOfflineReports, verifyReport, rerouteMission, acknowledgeDriverAlert, completeMission, addDecisionEvent]);

  const setDemoStep = useCallback((step: number) => {
    setCurrentDemoStep(step);
    executeDemoStepState(step);
  }, [executeDemoStepState]);

  const nextDemoStep = useCallback(() => {
    if (currentDemoStep < 12) {
      setDemoStep(currentDemoStep + 1);
    }
  }, [currentDemoStep, setDemoStep]);

  const prevDemoStep = useCallback(() => {
    if (currentDemoStep > 1) {
      setDemoStep(currentDemoStep - 1);
    }
  }, [currentDemoStep, setDemoStep]);

  // Edge cases triggers (confined strictly to the 3 roles)
  const triggerEdgeCase = useCallback((id: number) => {
    switch (id) {
      case 1:
        // 1. Offline report
        setNetworkState('offline');
        setActiveRole('field_officer');
        saveOfflineReport({
          segment_id: 'R-003',
          incident_type: 'fallen_tree',
          severity: 'medium',
          description: 'Pine tree down on gorge shoulder; offline queue demonstration.'
        });
        break;
      case 2:
        // 2. GPS with low accuracy (>100m)
        setActiveRole('field_officer');
        saveOfflineReport({
          segment_id: 'R-004',
          gps_accuracy_meters: 150,
          description: 'GPS accuracy degraded to 150m in mountain canyon. Checkpoint fallback: Sohrarim Gate.'
        });
        break;
      case 3:
        // 3. Stale road data (>2 hours old)
        setSegments(prev =>
          prev.map(s =>
            s.segment_id === 'R-002'
              ? {
                  ...s,
                  road_status: 'unknown',
                  last_updated_utc: '2026-09-14T22:00:00Z',
                  notes: 'Stale observation (>6 hours old). Telemetry lost at Mylliem AWS.'
                }
              : s
          )
        );
        setActiveRole('district_officer');
        break;
      case 4:
        // 4. Conflicting field report and AI prediction
        setFieldReports(prev => [
          {
            report_id: 'FR-CONFLICT',
            reporter_id: 'VOL-088',
            reporter_role: 'volunteer',
            segment_id: 'R-005',
            latitude: 25.2950,
            longitude: 91.7225,
            reported_at_local: 'Just now',
            reported_at_utc: new Date().toISOString(),
            gps_accuracy_meters: 12,
            incident_type: 'road_damage',
            road_status_reported: 'open',
            truck_access_reported: 'open',
            motorcycle_access_reported: 'open',
            bus_access_reported: 'open',
            emergency_access_reported: 'open',
            severity: 'low',
            photo_attached: true,
            description: 'Field check: road is open and dry, but AI model flags high rain risk!',
            network_status_at_submission: 'online',
            sync_status: 'sent',
            verification_status: 'needs_field_check',
            data_source: 'field_report_demo'
          },
          ...prev
        ]);
        setActiveRole('district_officer');
        break;
      case 5:
        // 5. Truck blocked while motorcycle remains open
        setSegments(prev =>
          prev.map(s =>
            s.segment_id === 'R-004'
              ? {
                  ...s,
                  road_status: 'restricted',
                  truck_access: 'blocked',
                  motorcycle_access: 'open',
                  bus_access: 'blocked',
                  notes: 'Edge slip: heavy truck lane collapsed; 1.5m motorcycle path open on bedrock.'
                }
              : s
          )
        );
        setActiveRole('district_officer');
        break;
      case 6:
        // 6. Photo upload pending (metadata synced, photo deferred)
        setFieldReports(prev => [
          {
            report_id: 'FR-PHOTO-WAIT',
            reporter_id: 'FO-033',
            reporter_role: 'field_officer',
            segment_id: 'R-003',
            latitude: 25.4310,
            longitude: 91.7900,
            reported_at_local: 'Just now',
            reported_at_utc: new Date().toISOString(),
            gps_accuracy_meters: 15,
            incident_type: 'bridge_damage',
            road_status_reported: 'restricted',
            truck_access_reported: 'restricted',
            motorcycle_access_reported: 'open',
            bus_access_reported: 'restricted',
            emergency_access_reported: 'open',
            severity: 'high',
            photo_attached: true,
            description: 'Bridge deck photo queued in low-bandwidth compression buffer (Photo Pending).',
            network_status_at_submission: 'weak_2g',
            sync_status: 'photo_pending',
            verification_status: 'pending',
            data_source: 'field_report_demo'
          },
          ...prev
        ]);
        setActiveRole('district_officer');
        break;
      case 7:
        // 7. Driver does not acknowledge alert (district officer escalated alert)
        setActiveRole('district_officer');
        setActiveAlert(prev => ({
          ...prev,
          show: true,
          acknowledged: false,
          reminderCount: 3
        }));
        break;
      case 8:
        // 8. All truck routes blocked -> triggers Safe Hub staging protocol
        setSegments(prev =>
          prev.map(s => ({
            ...s,
            road_status: 'blocked',
            truck_access: 'blocked'
          }))
        );
        stageCargoAtHub('SH-001');
        setActiveRole('district_officer');
        break;
      case 9:
        // 9. Duplicate reports detection
        setFieldReports(prev => [
          {
            report_id: 'FR-DUP-A',
            reporter_id: 'VOL-101',
            reporter_role: 'volunteer',
            segment_id: 'R-004',
            latitude: 25.3375,
            longitude: 91.7352,
            reported_at_local: '08:20 AM',
            reported_at_utc: new Date().toISOString(),
            gps_accuracy_meters: 10,
            incident_type: 'landslide',
            road_status_reported: 'blocked',
            truck_access_reported: 'blocked',
            motorcycle_access_reported: 'open',
            bus_access_reported: 'blocked',
            emergency_access_reported: 'restricted',
            severity: 'critical',
            photo_attached: true,
            description: 'Duplicate Candidate: Landslide report from upper hairpin.',
            network_status_at_submission: 'online',
            sync_status: 'sent',
            verification_status: 'pending',
            review_notes: 'Flagged as potential duplicate of FR-001 by AI proximity filter.',
            data_source: 'field_report_demo'
          },
          ...prev
        ]);
        setActiveRole('district_officer');
        break;
      case 10:
        // 10. Unknown road segment fallback
        setSegments(prev => [
          ...prev,
          {
            segment_id: 'R-UNKNOWN-99',
            segment_name: 'Unmapped Forest Extraction Track',
            start_location: 'Upper Shillong Peak Spur',
            end_location: 'Khadarshnong Gorge Track',
            start_lat: 25.5300,
            start_lon: 91.8400,
            end_lat: 25.4800,
            end_lon: 91.8000,
            road_type: 'unpaved_trail',
            length_km: 11.4,
            terrain_type: 'dense_jungle',
            slope_category: 'extreme',
            bridge_present: false,
            road_status: 'unknown',
            risk_level: 'high',
            risk_score: 75,
            truck_access: 'blocked',
            bus_access: 'blocked',
            motorcycle_access: 'restricted',
            emergency_vehicle_access: 'blocked',
            last_updated_utc: new Date().toISOString(),
            data_source: 'field_report_demo',
            confidence_score: 30,
            notes: 'Unknown road segment: Insufficient data. Field verification required before route consideration.'
          }
        ]);
        setActiveRole('district_officer');
        break;
      default:
        break;
    }
  }, [saveOfflineReport, stageCargoAtHub]);

  const resetCorridorState = useCallback(() => {
    setSegments(INITIAL_SEGMENTS);
    setIncidents(INITIAL_INCIDENTS);
    setFieldReports(INITIAL_FIELD_REPORTS);
    setVehicles(INITIAL_VEHICLES);
    setMissions(INITIAL_MISSIONS);
    setSafeHubs(INITIAL_SAFE_HUBS);
    setHealthFacilities(INITIAL_FACILITIES);
    setDecisionEvents(INITIAL_EVENTS);
    setCargoStagedAtHub(false);
    setActiveAlert({
      show: false,
      title: 'ROAD BLOCKED AHEAD — 2 KM',
      roadName: 'R-004 Mawkdok to Sohra Approach',
      routeBypass: 'TAKE ROUTE B (VIA UMTYNGAR BYPASS)',
      delayText: 'NEW DELAY: +25 MINUTES',
      distanceAhead: '2.4 KM',
      acknowledged: false,
      reminderCount: 0
    });
    setCurrentDemoStep(1);
    setActiveRole('driver');
    setIsMobileFrame(true);
    setNetworkState('online');
  }, []);

  return (
    <ResQContext.Provider
      value={{
        segments,
        incidents,
        fieldReports,
        vehicles,
        missions,
        safeHubs,
        healthFacilities,
        decisionEvents,
        selectedRole,
        activeRole,
        networkState,
        isMobileFrame,
        activeAlert,
        currentDemoStep,
        isTourActive,
        selectedSegment,
        selectedReport,
        cargoStagedAtHub,
        backendOnline,
        simulationIndex,
        useDeviceGps,
        setUseDeviceGps,
        selectedDriverVehicle,
        setSelectedDriverVehicle,
        setSelectedRole,
        setActiveRole,
        setNetworkState,
        setIsMobileFrame,
        setSelectedSegment,
        setSelectedReport,
        startMission,
        pauseMission,
        resumeMission,
        reportDriverProblem,
        escalateMission,
        sendDistrictAlert,
        saveOfflineReport,
        syncOfflineReports,
        verifyReport,
        rerouteMission,
        acknowledgeDriverAlert,
        completeMission,
        stageCargoAtHub,
        setDemoStep,
        nextDemoStep,
        prevDemoStep,
        triggerEdgeCase,
        resetCorridorState
      }}
    >
      {children}
    </ResQContext.Provider>
  );
};

export const useResQ = () => {
  const context = useContext(ResQContext);
  if (!context) {
    throw new Error('useResQ must be used within a ResQProvider');
  }
  return context;
};

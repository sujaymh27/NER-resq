/**
 * NER ResQ Backend API Client
 * Pilot Corridor: Shillong → Sohra, Meghalaya, India
 * Connects frontend to FastAPI backend (http://127.0.0.1:8000) with safe fallback.
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export const api = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/`, { method: 'GET' }, 2500);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Road segments
  async getSegments(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/segments`);
      if (!res.ok) throw new Error('Failed to fetch segments');
      return await res.json();
    } catch (e) {
      console.warn('API segments fetch failed, using local fallback:', e);
      return [];
    }
  },

  async updateSegmentStatus(segmentId: string, payload: any): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/segments/${segmentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update segment status');
      return await res.json();
    } catch (e) {
      console.warn('API segment status update failed, local state will reflect change:', e);
      return null;
    }
  },

  // Field Reports
  async getFieldReports(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/field-reports`);
      if (!res.ok) throw new Error('Failed to fetch field reports');
      return await res.json();
    } catch (e) {
      console.warn('API field reports fetch failed, using local fallback:', e);
      return [];
    }
  },

  async submitFieldReport(report: any): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/field-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (!res.ok) throw new Error('Failed to submit field report');
      return await res.json();
    } catch (e) {
      console.warn('API field report submit failed, stored in local queue:', e);
      return null;
    }
  },

  async verifyFieldReport(reportId: string, action: string, reviewNotes: string, applyToRoad = true): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/field-reports/${reportId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewed_by: 'District Emergency Operations Center (DEOC)',
          review_notes: reviewNotes,
          apply_to_road: applyToRoad
        })
      });
      if (!res.ok) throw new Error('Failed to verify field report');
      return await res.json();
    } catch (e) {
      console.warn('API verify field report failed, local state updated:', e);
      return null;
    }
  },

  // Missions & Routing
  async getMissions(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions`);
      if (!res.ok) throw new Error('Failed to fetch missions');
      return await res.json();
    } catch (e) {
      console.warn('API missions fetch failed:', e);
      return [];
    }
  },

  async getActiveMissions(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/active`);
      if (!res.ok) throw new Error('Failed to fetch active missions');
      return await res.json();
    } catch (e) {
      console.warn('API active missions fetch failed:', e);
      return [];
    }
  },

  async getMission(missionId: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}`);
      if (!res.ok) throw new Error('Failed to fetch mission');
      return await res.json();
    } catch (e) {
      console.warn(`API get mission ${missionId} failed:`, e);
      return null;
    }
  },

  async createMission(payload: any): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create mission');
      return await res.json();
    } catch (e) {
      console.warn('API create mission failed, fallback to local state:', e);
      return null;
    }
  },

  async updateMissionLocation(missionId: string, locationData: {
    latitude: number;
    longitude: number;
    current_road_segment?: string;
    speed_kmh?: number;
    eta?: string;
    distance_remaining_km?: number;
  }): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData)
      });
      if (!res.ok) throw new Error('Failed to update mission location');
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async pauseMission(missionId: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (e) {
      console.warn('API pause mission failed:', e);
      return null;
    }
  },

  async resumeMission(missionId: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (e) {
      console.warn('API resume mission failed:', e);
      return null;
    }
  },

  async sendMissionAlert(missionId: string, alertText: string, severity = 'warning'): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_text: alertText, severity })
      });
      return await res.json();
    } catch (e) {
      console.warn('API send mission alert failed:', e);
      return null;
    }
  },

  async acknowledgeMissionAlert(missionId: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/alert/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return await res.json();
    } catch (e) {
      console.warn('API acknowledge mission alert failed:', e);
      return null;
    }
  },

  async rerouteMission(missionId: string, newRoute: string, delayMinutes: number, alertText: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/reroute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_route: newRoute,
          delay_minutes: delayMinutes,
          alert_text: alertText
        })
      });
      if (!res.ok) throw new Error('Failed to reroute mission');
      return await res.json();
    } catch (e) {
      console.warn('API reroute mission failed, local state updated:', e);
      return null;
    }
  },

  async escalateMission(missionId: string, notes = 'Corridor blocked; emergency escalation'): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      return await res.json();
    } catch (e) {
      console.warn('API escalate mission failed:', e);
      return null;
    }
  },

  // Driver Actions
  async acknowledgeDriverAlert(vehicleId: string, missionId: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/driver/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId, mission_id: missionId })
      });
      if (!res.ok) throw new Error('Failed to acknowledge driver alert');
      return await res.json();
    } catch (e) {
      console.warn('API driver acknowledge failed, local state updated:', e);
      return null;
    }
  },

  async completeMission(vehicleId: string, missionId: string): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/missions/${missionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to complete mission');
      return await res.json();
    } catch (e) {
      console.warn('API driver complete mission failed, local state updated:', e);
      return null;
    }
  },

  // AI Risk & Route Engines
  async evaluateRisk(payload: {
    rainfall_risk: number;
    terrain_risk: number;
    incident_history_risk: number;
    field_report_risk: number;
    road_condition_risk: number;
    data_freshness?: number;
  }): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/risk/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to evaluate risk');
      return await res.json();
    } catch (e) {
      console.warn('API evaluate risk failed:', e);
      return null;
    }
  },

  async evaluateRoutes(vehicleType = 'medical_supply_truck', missionPriority = 'critical'): Promise<any> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/routes/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_type: vehicleType,
          mission_priority: missionPriority
        })
      });
      if (!res.ok) throw new Error('Failed to evaluate routes');
      return await res.json();
    } catch (e) {
      console.warn('API evaluate routes failed:', e);
      return null;
    }
  },

  // Decision Timeline Events
  async getDecisionEvents(): Promise<any[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/api/decision-events`);
      if (!res.ok) throw new Error('Failed to fetch decision events');
      return await res.json();
    } catch (e) {
      console.warn('API decision events fetch failed:', e);
      return [];
    }
  }
};

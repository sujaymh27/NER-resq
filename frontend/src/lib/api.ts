/**
 * NER ResQ Backend API Client
 * Pilot Corridor: Shillong → Sohra, Meghalaya, India
 * Connects frontend to FastAPI backend (http://127.0.0.1:8000) with safe fallback.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
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
      const res = await fetchWithTimeout(`${API_BASE}/`, { method: 'GET' }, 2000);
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
      const res = await fetchWithTimeout(`${API_BASE}/api/driver/complete-mission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId, mission_id: missionId })
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

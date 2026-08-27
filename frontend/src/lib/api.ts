import { FactoryOverview, AssetTelemetry, ZoneSummary, AlertItem, WorkOrder, AIPrescriptionItem, AIModelMetrics, WhatIfSimulationRequest, WhatIfSimulationResponse, TelemetryWebSocketMessage } from "./types";
import { MOCK_OVERVIEW, MOCK_ASSETS, MOCK_ZONES, MOCK_ALERTS, MOCK_WORK_ORDERS } from "./mockFallback";

const API_BASE = "http://localhost:8000/api";
const WS_BASE = "ws://localhost:8000/ws/telemetry";

export async function fetchFactoryOverview(): Promise<FactoryOverview> {
  try {
    const res = await fetch(`${API_BASE}/factory/overview`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return MOCK_OVERVIEW;
  }
}

export async function fetchAllZones(): Promise<ZoneSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/zones`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return MOCK_ZONES;
  }
}

export async function fetchZoneById(zoneId: string): Promise<ZoneSummary> {
  try {
    const res = await fetch(`${API_BASE}/zones/${zoneId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    const found = MOCK_ZONES.find(z => z.id === zoneId);
    if (found) return found;
    return MOCK_ZONES[0];
  }
}

export async function fetchZoneAnalytics(zoneId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/zones/${zoneId}/analytics`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    const zone = MOCK_ZONES.find(z => z.id === zoneId) || MOCK_ZONES[0];
    return {
      zone,
      assets_count: 4,
      hourly_trends: Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, "0")}:00`,
        oee: Math.round(zone.oee + ((i % 5) - 2) * 1.2),
        availability: Math.round(zone.availability + ((i % 3) - 1) * 0.8),
        performance: Math.round(zone.performance + ((i % 4) - 2) * 0.9),
        quality: 99.1,
        power_kw: Math.round(zone.power_consumption_kwh * 0.9)
      })),
      prescriptions: [],
      downtime_pareto: [
        { category: "Unplanned Bearing Overheating", hours: 1.2, pct: 45 },
        { category: "Pneumatic / Hydraulic Seal Leak", hours: 0.8, pct: 30 },
        { category: "Sensor Recalibration & Drift", hours: 0.4, pct: 15 },
        { category: "Changeover & Tool Wear", hours: 0.2, pct: 10 }
      ]
    };
  }
}

export async function fetchAllAssets(zoneId?: string): Promise<AssetTelemetry[]> {
  try {
    const url = zoneId ? `${API_BASE}/assets?zone_id=${zoneId}` : `${API_BASE}/assets`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    if (zoneId) return MOCK_ASSETS.filter(a => a.zone_id === zoneId);
    return MOCK_ASSETS;
  }
}

export async function fetchAssetById(assetId: string): Promise<AssetTelemetry> {
  try {
    const res = await fetch(`${API_BASE}/assets/${assetId}`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    const found = MOCK_ASSETS.find(a => a.id === assetId);
    if (found) return found;
    return MOCK_ASSETS[0];
  }
}

export async function fetchAssetHistory(assetId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/assets/${assetId}/history`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    const asset = MOCK_ASSETS.find(a => a.id === assetId) || MOCK_ASSETS[0];
    const curve = [];
    for (let c = -20; c <= 0; c += 5) {
      curve.push({
        cycle: c,
        phase: "historical",
        health_index: Math.min(100, asset.prediction.health_index + Math.abs(c) * 1.5),
        ci_lower: Math.min(100, asset.prediction.health_index + Math.abs(c) * 1.3),
        ci_upper: Math.min(100, asset.prediction.health_index + Math.abs(c) * 1.7)
      });
    }
    for (let c = 5; c <= asset.prediction.rul_cycles + 10; c += 5) {
      const h = Math.max(0, asset.prediction.health_index - (asset.prediction.health_index / asset.prediction.rul_cycles) * c);
      curve.push({
        cycle: c,
        phase: "projected",
        health_index: Math.round(h),
        ci_lower: Math.max(0, Math.round(h - c * 0.2)),
        ci_upper: Math.min(100, Math.round(h + c * 0.2))
      });
    }
    return {
      asset_id: assetId,
      recent_telemetry_points: [],
      degradation_curve: curve,
      sensor_thresholds: {
        vibration_rms: { warn: 2.8, crit: 4.5, unit: "mm/s" },
        bearing_temp: { warn: 75.0, crit: 90.0, unit: "°C" }
      }
    };
  }
}

export async function fetchDigitalTwinHierarchy(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/digital-twins/hierarchy`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return {
      factory_id: "apex-smart-plant-04",
      factory_name: "Apex Advanced Smart Manufacturing Facility (Plant 04)",
      zones: MOCK_ZONES.map(z => ({
        id: z.id,
        name: z.name,
        schematic_type: z.schematic_type,
        health_score: z.health_score,
        status: z.status,
        assets: MOCK_ASSETS.filter(a => a.zone_id === z.id).map(a => ({
          id: a.id,
          name: a.name,
          category: a.category,
          health_state: a.health_state,
          health_index: a.prediction.health_index,
          rul_cycles: a.prediction.rul_cycles,
          components_count: a.components.length,
          components: a.components
        }))
      }))
    };
  }
}

export async function simulateWhatIf(payload: WhatIfSimulationRequest): Promise<WhatIfSimulationResponse> {
  try {
    const res = await fetch(`${API_BASE}/digital-twins/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    const asset = MOCK_ASSETS.find(a => a.id === payload.asset_id) || MOCK_ASSETS[0];
    const stressMult = 1.0 + (payload.load_pct_delta / 100) * 1.5 + (payload.rpm_delta / 1500) * 0.8 + ((100 - payload.lubrication_quality_pct) / 50) * 0.5;
    const simRul = Math.max(5, Math.round(asset.prediction.rul_cycles / stressMult));
    const deltaPct = Math.round(((simRul - asset.prediction.rul_cycles) / asset.prediction.rul_cycles) * 100);
    const simHealth = Math.max(10, Math.round(asset.prediction.health_index - (stressMult - 1.0) * 30));

    return {
      asset_id: payload.asset_id,
      baseline_rul_cycles: asset.prediction.rul_cycles,
      simulated_rul_cycles: simRul,
      rul_delta_pct: deltaPct,
      baseline_health_index: asset.prediction.health_index,
      simulated_health_index: simHealth,
      risk_level_delta: simHealth < 45 ? "CRITICAL RISK: Imminent fatigue breakdown predicted" : simHealth < 75 ? "ELEVATED RISK: Accelerated bearing/winding wear" : "LOW RISK: Safe operating envelope",
      projected_failure_mode: payload.lubrication_quality_pct < 70 ? "Bearing Outer Race Spall" : "Stator Winding Overheat",
      projected_thermal_rise_c: Math.round(payload.ambient_temp_delta * 0.8 + payload.load_pct_delta * 0.2),
      projected_vibration_spike_pct: Math.round((stressMult - 1.0) * 80),
      recommendation: `Simulation indicates a ${deltaPct >= 0 ? "+" : ""}${deltaPct}% shift in asset RUL under specified operating parameters.`,
      degradation_curve_simulated: Array.from({ length: 11 }, (_, i) => ({
        cycle: i * 5,
        baseline_health: Math.max(0, Math.round(asset.prediction.health_index - (i * 5) * 1.5)),
        simulated_health: Math.max(0, Math.round(simHealth - (i * 5) * 1.5 * stressMult)),
        uncertainty_lower: Math.max(0, Math.round((simHealth - (i * 5) * 1.5 * stressMult) * 0.88)),
        uncertainty_upper: Math.min(100, Math.round((simHealth - (i * 5) * 1.5 * stressMult) * 1.12))
      }))
    };
  }
}

export async function fetchAIModels(): Promise<AIModelMetrics[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/models`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return [
      {
        model_name: "XGBoost-RUL-Ensemble-v4.2",
        model_type: "Gradient Boosted Quantile Trees",
        target: "Remaining Useful Life (Cycles & Hours)",
        accuracy_score: 0.962,
        mae_cycles: 3.4,
        r2_score: 0.948,
        psi_drift_index: 0.042,
        status: "Optimal",
        last_trained: "2026-08-20 03:00:00",
        inference_latency_ms: 4.8,
        samples_monitored: 1482900
      },
      {
        model_name: "Temporal-ConvNet-LSTM-Anomaly-v3.1",
        model_type: "Deep TCN / Bi-LSTM Sequence Model",
        target: "Early Sensor Anomaly & Health Index",
        accuracy_score: 0.978,
        mae_cycles: 1.8,
        r2_score: 0.965,
        psi_drift_index: 0.058,
        status: "Optimal",
        last_trained: "2026-08-22 04:30:00",
        inference_latency_ms: 8.2,
        samples_monitored: 2850000
      },
      {
        model_name: "MultiClass-FailureMode-Classifier-v2.8",
        model_type: "LightGBM Multi-Class Classifier",
        target: "Fault Root Cause Mode & Defect Class",
        accuracy_score: 0.941,
        mae_cycles: 0.0,
        r2_score: 0.923,
        psi_drift_index: 0.071,
        status: "Optimal",
        last_trained: "2026-08-25 02:15:00",
        inference_latency_ms: 3.1,
        samples_monitored: 950400
      }
    ];
  }
}

export async function fetchAIPrescriptions(): Promise<AIPrescriptionItem[]> {
  try {
    const res = await fetch(`${API_BASE}/ai/recommendations`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return [
      {
        id: "RX-cmp-01-1",
        asset_id: "cmp-01",
        asset_name: "Centrifugal Air Compressor 01 (250kW)",
        zone_id: "utilities",
        predicted_failure_mode: "Bearing Outer Race Defect",
        confidence: 88.4,
        lead_time_hours: 43.7,
        recommended_action: "Schedule emergency bearing replacement and shaft laser alignment before vibration exceeds 4.5 mm/s limit.",
        urgency: "Immediate",
        estimated_downtime_avoidance_usd: 54000.0,
        feedback_status: "Pending Review"
      },
      {
        id: "RX-cnc-01-1",
        asset_id: "cnc-01",
        asset_name: "5-Axis CNC Milling Center 01",
        zone_id: "production",
        predicted_failure_mode: "Spindle Tool Wear",
        confidence: 82.5,
        lead_time_hours: 65.5,
        recommended_action: "Clean ceramic hybrid bearing raceway and index worn carbide milling inserts during shift handover.",
        urgency: "Within 24h",
        estimated_downtime_avoidance_usd: 38000.0,
        feedback_status: "Approved",
        reviewed_by: "Lead Production Eng."
      }
    ];
  }
}

export async function submitAIFeedback(prescriptionId: string, action: string, notes: string, reviewedBy: string) {
  try {
    const res = await fetch(`${API_BASE}/ai/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prescription_id: prescriptionId, action, notes, reviewed_by: reviewedBy })
    });
    return await res.json();
  } catch (err) {
    return { success: true, message: `Feedback ${action} applied locally` };
  }
}

export async function fetchAlerts(): Promise<AlertItem[]> {
  try {
    const res = await fetch(`${API_BASE}/alerts`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return MOCK_ALERTS;
  }
}

export async function acknowledgeAlert(alertId: string, user: string = "[STATION-OP]") {
  try {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user })
    });
    return await res.json();
  } catch (err) {
    return { success: true, alert_id: alertId };
  }
}

export async function convertAlertToWorkOrder(alertId: string, assignedTo: string = "Dave Miller (Senior Millwright)") {
  try {
    const res = await fetch(`${API_BASE}/alerts/${alertId}/convert-to-work-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: assignedTo })
    });
    return await res.json();
  } catch (err) {
    return MOCK_WORK_ORDERS[0];
  }
}

export async function fetchWorkOrders(): Promise<WorkOrder[]> {
  try {
    const res = await fetch(`${API_BASE}/work-orders`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return MOCK_WORK_ORDERS;
  }
}

export async function createWorkOrder(payload: Partial<WorkOrder>): Promise<WorkOrder> {
  try {
    const res = await fetch(`${API_BASE}/work-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    return {
      id: `WO-${Math.floor(Math.random() * 1000 + 8950)}`,
      title: payload.title || "Manual Work Order",
      asset_id: payload.asset_id || "cmp-01",
      asset_name: payload.asset_name || "Centrifugal Compressor 01",
      zone_id: payload.zone_id || "utilities",
      zone_name: payload.zone_name || "Utilities",
      priority: payload.priority || "P2 - High",
      status: payload.status || "Open",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 19),
      assigned_to: payload.assigned_to || "Dave Miller",
      estimated_hours: payload.estimated_hours || 3.0,
      prescriptive_procedure: payload.prescriptive_procedure || "Execute standard maintenance.",
      required_parts: payload.required_parts || ["OEM Seal Kit"],
      parts_status: "In Stock",
      estimated_cost_usd: payload.estimated_cost_usd || 1200.0,
      notes: []
    };
  }
}

export async function updateWorkOrderStatus(workOrderId: string, status: string) {
  try {
    const res = await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (err) {
    return { success: true, work_order_id: workOrderId, status };
  }
}

export async function fetchReportsAnalytics(timeframe: string = "30d"): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/reports/analytics?timeframe=${timeframe}`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return {
      timeframe,
      oee_trend: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-08-${(i + 1).toString().padStart(2, "0")}`,
        overall_oee: 88.0 + Math.sin(i) * 3.5,
        availability: 93.0 + Math.cos(i) * 2.0,
        performance: 96.0 + Math.sin(i * 0.5) * 1.5,
        quality: 99.2,
        downtime_hours: Math.max(0.5, 3.5 - Math.sin(i) * 1.5)
      })),
      downtime_pareto: [
        { root_cause: "Bearing Outer Race Fatigue & Spall", downtime_hours: 38.5, cost_usd: 77000.0, events_count: 14, cumulative_pct: 36.2 },
        { root_cause: "Mechanical Seal & Hydraulic Leakage", downtime_hours: 26.2, cost_usd: 52400.0, events_count: 9, cumulative_pct: 60.8 },
        { root_cause: "Motor Stator Insulation Thermal Drift", downtime_hours: 18.0, cost_usd: 36000.0, events_count: 6, cumulative_pct: 77.7 },
        { root_cause: "Pneumatic Solenoid Valve Sticking", downtime_hours: 12.5, cost_usd: 25000.0, events_count: 11, cumulative_pct: 89.5 },
        { root_cause: "Spindle Drawbar Clamping Force Loss", downtime_hours: 6.8, cost_usd: 13600.0, events_count: 4, cumulative_pct: 95.9 }
      ],
      reliability_metrics: [
        { zone: "Utilities & Power", mtbf_hours: 740, mttr_hours: 2.8, availability_pct: 99.1, criticality: "Tier 1" },
        { zone: "Production & Machining", mtbf_hours: 320, mttr_hours: 3.4, availability_pct: 91.5, criticality: "Tier 1" },
        { zone: "Packaging & Bottling", mtbf_hours: 480, mttr_hours: 1.9, availability_pct: 94.8, criticality: "Tier 2" },
        { zone: "Warehouse & Logistics", mtbf_hours: 610, mttr_hours: 2.2, availability_pct: 96.4, criticality: "Tier 2" },
        { zone: "Quality Assurance", mtbf_hours: 890, mttr_hours: 1.4, availability_pct: 99.4, criticality: "Tier 3" }
      ],
      cost_metrics: {
        unplanned_downtime_avoided_usd: 384500.0,
        catastrophic_secondary_damage_prevented_usd: 142000.0,
        optimized_spare_parts_inventory_usd: 56000.0,
        extended_asset_useful_life_roi_usd: 92000.0,
        total_financial_impact_usd: 674500.0
      }
    };
  }
}

export async function fetchSettings(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/settings`, { cache: "no-store" });
    if (!res.ok) throw new Error("API error");
    return await res.json();
  } catch (err) {
    return {
      factory_name: "Apex Advanced Smart Manufacturing Facility (Plant 04)",
      shift: "Shift 2 (Afternoon / Evening 14:00 - 22:00)",
      active_role: "[STATION-OP]",
      klaxon_alarm_enabled: true,
      sms_dispatch_enabled: true,
      email_alerts_enabled: true,
      auto_wo_threshold: "CRITICAL",
      vibration_warn_threshold_mms: 2.8,
      vibration_crit_threshold_mms: 4.5,
      temp_warn_threshold_c: 75.0,
      temp_crit_threshold_c: 90.0,
      retraining_schedule: "Weekly Automatic (Sunday 02:00 AM)",
      ai_sensitivity: "Medium-High (0.85 F1 optimization)"
    };
  }
}

export async function injectFaultScenario(assetId: string, faultType: string, magnitude: number) {
  try {
    const res = await fetch(`${API_BASE}/factory/scenarios/inject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_id: assetId, fault_type: faultType, magnitude })
    });
    return await res.json();
  } catch (err) {
    return { success: true };
  }
}

export async function resetFaultScenarios() {
  try {
    const res = await fetch(`${API_BASE}/factory/scenarios/reset`, { method: "POST" });
    return await res.json();
  } catch (err) {
    return { success: true };
  }
}

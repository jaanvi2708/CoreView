export type HealthState = "Healthy" | "Warning" | "Critical";
export type AssetStatus = "Operational" | "Degraded" | "Critical" | "Maintenance" | "Offline";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type WorkOrderStatus = "Open" | "Assigned" | "In Progress" | "Review" | "Completed";
export type WorkOrderPriority = "P1 - Emergency" | "P2 - High" | "P3 - Medium" | "P4 - Low";

export interface ComponentTwinState {
  id: string;
  name: string;
  component_type: string;
  health_score: number;
  status: HealthState;
  temperature: number;
  vibration_rms: number;
  failure_risk: number;
  defect_type?: string | null;
  hotspot: boolean;
}

export interface AssetPrediction {
  rul_cycles: number;
  rul_hours: number;
  rul_ci_lower: number;
  rul_ci_upper: number;
  health_index: number;
  health_state: HealthState;
  failure_mode: string;
  failure_mode_probability: number;
  failure_mode_distribution: Record<string, number>;
  anomaly_score: number;
  lead_time_hours: number;
  shap_contributions: Record<string, number>;
  prescriptive_action: string;
  estimated_wrench_time_hrs: number;
  required_parts: string[];
  downtime_cost_risk_usd: number;
}

export interface AssetTelemetry {
  id: string;
  name: string;
  zone_id: string;
  zone_name: string;
  category: "compressor" | "cnc_mill" | "flow_wrapper" | "chiller" | "robotic_arm" | "asrs_crane" | "stamping_press";
  status: AssetStatus;
  health_state: HealthState;
  operational_hours: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  load_pct: number;
  rpm: number;
  power_kw: number;
  
  // Sensors
  vibration_x: number;
  vibration_y: number;
  vibration_z: number;
  vibration_peak: number;
  vibration_crest_factor: number;
  temperature_motor: number;
  temperature_bearing: number;
  temperature_ambient: number;
  motor_current_a: number;
  phase_imbalance_pct: number;
  acoustic_emission_db: number;
  pressure_bar: number;
  pressure_diff_bar: number;
  flow_rate_lpm: number;
  oil_iso_code: string;
  oil_particles_count: number;
  tank_level_pct: number;
  air_quality_voc_ppm: number;
  
  prediction: AssetPrediction;
  components: ComponentTwinState[];
  last_updated: string;
}

export interface ZoneSummary {
  id: string;
  name: string;
  description: string;
  supervisor: string;
  total_assets: number;
  healthy_assets: number;
  warning_assets: number;
  critical_assets: number;
  health_score: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  active_alarms_count: number;
  downtime_hrs_24h: number;
  downtime_cost_24h_usd: number;
  power_consumption_kwh: number;
  status: HealthState;
  schematic_type: string;
}

export interface AlertItem {
  id: string;
  asset_id: string;
  asset_name: string;
  zone_id: string;
  zone_name: string;
  timestamp: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  failure_mode: string;
  sensor_trigger: string;
  trigger_value: string;
  threshold_value: string;
  lead_time_hours: number;
  estimated_cost_usd: number;
  acknowledged: boolean;
  acknowledged_by?: string | null;
  work_order_id?: string | null;
}

export interface WorkOrder {
  id: string;
  title: string;
  asset_id: string;
  asset_name: string;
  zone_id: string;
  zone_name: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  created_at: string;
  assigned_to?: string | null;
  assigned_technician_role?: string | null;
  scheduled_start?: string | null;
  estimated_hours: number;
  actual_hours?: number | null;
  prescriptive_procedure: string;
  required_parts: string[];
  parts_status: "In Stock" | "Reserved" | "On Order" | "Awaiting Delivery";
  estimated_cost_usd: number;
  actual_cost_usd?: number | null;
  source_alert_id?: string | null;
  notes: string[];
}

export interface AIPrescriptionItem {
  id: string;
  asset_id: string;
  asset_name: string;
  zone_id: string;
  predicted_failure_mode: string;
  confidence: number;
  lead_time_hours: number;
  recommended_action: string;
  urgency: "Immediate" | "Within 24h" | "Next Shift" | "Scheduled Maintenance";
  estimated_downtime_avoidance_usd: number;
  feedback_status: "Pending Review" | "Approved" | "Rejected" | "Overridden";
  feedback_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface AIModelMetrics {
  model_name: string;
  model_type: string;
  target: string;
  accuracy_score: number;
  mae_cycles: number;
  r2_score: number;
  psi_drift_index: number;
  status: "Optimal" | "Moderate Drift" | "Retraining Required";
  last_trained: string;
  inference_latency_ms: number;
  samples_monitored: number;
}

export interface WhatIfSimulationRequest {
  asset_id: string;
  load_pct_delta: number;
  rpm_delta: number;
  ambient_temp_delta: number;
  lubrication_quality_pct: number;
}

export interface WhatIfSimulationResponse {
  asset_id: string;
  baseline_rul_cycles: number;
  simulated_rul_cycles: number;
  rul_delta_pct: number;
  baseline_health_index: number;
  simulated_health_index: number;
  risk_level_delta: string;
  projected_failure_mode: string;
  projected_thermal_rise_c: number;
  projected_vibration_spike_pct: number;
  recommendation: string;
  degradation_curve_simulated: {
    cycle: number;
    baseline_health: number;
    simulated_health: number;
    uncertainty_lower: number;
    uncertainty_upper: number;
  }[];
}

export interface FactoryOverview {
  timestamp: string;
  factory_name: string;
  plant_status: "Operational" | "Partial Derated" | "Critical Attention";
  overall_oee: number;
  overall_availability: number;
  overall_performance: number;
  overall_quality: number;
  active_alerts_total: number;
  critical_alerts_count: number;
  warning_alerts_count: number;
  critical_assets_count: number;
  predicted_failures_7d: number;
  predicted_failures_30d: number;
  estimated_downtime_cost_avoided_usd: number;
  total_power_active_mw: number;
  total_iot_sensors_online: number;
  ai_monitoring_status: string;
  top_risk_assets: {
    id: string;
    name: string;
    zone_id: string;
    zone_name: string;
    health_state: HealthState;
    health_index: number;
    rul_cycles: number;
    rul_hours: number;
    failure_mode: string;
    risk_score: number;
    cost_exposure_usd: number;
    lead_time_hours: number;
  }[];
  zone_summaries: ZoneSummary[];
  collective_sensor_health: Record<string, { online: number; warning: number; critical: number; health_pct: number }>;
}

export interface TelemetryWebSocketMessage {
  type: "FACTORY_TELEMETRY_UPDATE";
  timestamp: string;
  overview: FactoryOverview;
  assets: AssetTelemetry[];
  zones: ZoneSummary[];
  recent_alerts: AlertItem[];
}

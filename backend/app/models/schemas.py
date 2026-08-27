from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Literal
from datetime import datetime

# Sensor Data Types
class SensorReading(BaseModel):
    name: str
    sensor_type: str # vibration, temperature, current, acoustic, pressure, rpm, flow, oil, level, air_quality
    value: float
    unit: str
    status: Literal["normal", "warning", "critical"]
    baseline: float
    threshold_warn: float
    threshold_crit: float
    history: List[float] = []

class ComponentTwinState(BaseModel):
    id: str
    name: str
    component_type: str # bearing, motor, impeller, seal, valve, gearbox, spindle, belt
    health_score: float # 0 - 100
    status: Literal["Healthy", "Warning", "Critical"]
    temperature: float
    vibration_rms: float
    failure_risk: float
    defect_type: Optional[str] = None
    hotspot: bool = False

class AssetPrediction(BaseModel):
    rul_cycles: int
    rul_hours: float
    rul_ci_lower: float # 5th percentile
    rul_ci_upper: float # 95th percentile
    health_index: float # 0 - 100
    health_state: Literal["Healthy", "Warning", "Critical"]
    failure_mode: str
    failure_mode_probability: float
    failure_mode_distribution: Dict[str, float]
    anomaly_score: float # 0 - 1.0
    lead_time_hours: float
    shap_contributions: Dict[str, float] # Feature importance
    prescriptive_action: str
    estimated_wrench_time_hrs: float
    required_parts: List[str]
    downtime_cost_risk_usd: float

class AssetTelemetry(BaseModel):
    id: str
    name: str
    zone_id: str
    zone_name: str
    category: str # compressor, cnc_mill, flow_wrapper, chiller, robotic_arm, asrs_crane, stamping_press
    status: Literal["Operational", "Degraded", "Critical", "Maintenance", "Offline"]
    health_state: Literal["Healthy", "Warning", "Critical"]
    operational_hours: float
    oee: float
    availability: float
    performance: float
    quality: float
    load_pct: float
    rpm: float
    power_kw: float
    
    # Specific sensor channels
    vibration_x: float # mm/s RMS
    vibration_y: float
    vibration_z: float
    vibration_peak: float
    vibration_crest_factor: float
    temperature_motor: float # °C
    temperature_bearing: float
    temperature_ambient: float
    motor_current_a: float # Amperes
    phase_imbalance_pct: float
    acoustic_emission_db: float # Ultrasound dB
    pressure_bar: float # Bar / PSI
    pressure_diff_bar: float
    flow_rate_lpm: float # L/min
    oil_iso_code: str # e.g. "18/16/13"
    oil_particles_count: int
    tank_level_pct: float
    air_quality_voc_ppm: float
    
    # AI Predictions
    prediction: AssetPrediction
    
    # Digital Twin breakdown
    components: List[ComponentTwinState]
    last_updated: str

class ZoneSummary(BaseModel):
    id: str # production, packaging, warehouse, utilities, quality
    name: str
    description: str
    supervisor: str
    total_assets: int
    healthy_assets: int
    warning_assets: int
    critical_assets: int
    health_score: float # 0 - 100
    oee: float
    availability: float
    performance: float
    quality: float
    active_alarms_count: int
    downtime_hrs_24h: float
    downtime_cost_24h_usd: float
    power_consumption_kwh: float
    status: Literal["Healthy", "Warning", "Critical"]
    schematic_type: str

class AlertItem(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    zone_id: str
    zone_name: str
    timestamp: str
    severity: Literal["CRITICAL", "WARNING", "INFO"]
    title: str
    description: str
    failure_mode: str
    sensor_trigger: str
    trigger_value: str
    threshold_value: str
    lead_time_hours: float
    estimated_cost_usd: float
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    work_order_id: Optional[str] = None

class WorkOrder(BaseModel):
    id: str
    title: str
    asset_id: str
    asset_name: str
    zone_id: str
    zone_name: str
    priority: Literal["P1 - Emergency", "P2 - High", "P3 - Medium", "P4 - Low"]
    status: Literal["Open", "Assigned", "In Progress", "Review", "Completed"]
    created_at: str
    assigned_to: Optional[str] = None
    assigned_technician_role: Optional[str] = None
    scheduled_start: Optional[str] = None
    estimated_hours: float
    actual_hours: Optional[float] = None
    prescriptive_procedure: str
    required_parts: List[str]
    parts_status: Literal["In Stock", "Reserved", "On Order", "Awaiting Delivery"]
    estimated_cost_usd: float
    actual_cost_usd: Optional[float] = None
    source_alert_id: Optional[str] = None
    notes: List[str] = []

class AIPrescriptionItem(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    zone_id: str
    predicted_failure_mode: str
    confidence: float
    lead_time_hours: float
    recommended_action: str
    urgency: Literal["Immediate", "Within 24h", "Next Shift", "Scheduled Maintenance"]
    estimated_downtime_avoidance_usd: float
    feedback_status: Literal["Pending Review", "Approved", "Rejected", "Overridden"]
    feedback_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

class AIModelMetrics(BaseModel):
    model_name: str
    model_type: str # Gradient Boosting, LSTM/TCN, Autoencoder, SHAP
    target: str
    accuracy_score: float
    mae_cycles: float
    r2_score: float
    psi_drift_index: float # Population Stability Index
    status: Literal["Optimal", "Moderate Drift", "Retraining Required"]
    last_trained: str
    inference_latency_ms: float
    samples_monitored: int

class WhatIfSimulationRequest(BaseModel):
    asset_id: str
    load_pct_delta: float = 0.0 # e.g. +20%
    rpm_delta: float = 0.0 # e.g. +300 RPM
    ambient_temp_delta: float = 0.0 # e.g. +10 °C
    lubrication_quality_pct: float = 100.0 # 0 - 100%

class WhatIfSimulationResponse(BaseModel):
    asset_id: str
    baseline_rul_cycles: int
    simulated_rul_cycles: int
    rul_delta_pct: float
    baseline_health_index: float
    simulated_health_index: float
    risk_level_delta: str
    projected_failure_mode: str
    projected_thermal_rise_c: float
    projected_vibration_spike_pct: float
    recommendation: str
    degradation_curve_simulated: List[Dict[str, float]]

class FactoryOverview(BaseModel):
    timestamp: str
    factory_name: str
    plant_status: Literal["Operational", "Partial Derated", "Critical Attention"]
    overall_oee: float
    overall_availability: float
    overall_performance: float
    overall_quality: float
    active_alerts_total: int
    critical_alerts_count: int
    warning_alerts_count: int
    critical_assets_count: int
    predicted_failures_7d: int
    predicted_failures_30d: int
    estimated_downtime_cost_avoided_usd: float
    total_power_active_mw: float
    total_iot_sensors_online: int
    ai_monitoring_status: str
    top_risk_assets: List[Dict[str, Any]]
    zone_summaries: List[ZoneSummary]
    collective_sensor_health: Dict[str, Any]

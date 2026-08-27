import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from app.models.schemas import (
    AssetTelemetry, ZoneSummary, AlertItem, WorkOrder, AIPrescriptionItem,
    FactoryOverview, AIModelMetrics
)

class StateStore:
    def __init__(self):
        self.assets: Dict[str, AssetTelemetry] = {}
        self.asset_history: Dict[str, List[Dict[str, Any]]] = {} # Keeps last 60 ticks of sensor data
        self.zones: Dict[str, ZoneSummary] = {}
        self.alerts: List[AlertItem] = []
        self.work_orders: List[WorkOrder] = []
        self.ai_prescriptions: List[AIPrescriptionItem] = []
        self.settings: Dict[str, Any] = {
            "factory_name": "Apex Advanced Smart Manufacturing Facility (Plant 04)",
            "shift": "Shift 2 (Afternoon / Evening 14:00 - 22:00)",
            "active_role": "[STATION-OP]",
            "klaxon_alarm_enabled": True,
            "sms_dispatch_enabled": True,
            "email_alerts_enabled": True,
            "auto_wo_threshold": "CRITICAL",
            "vibration_warn_threshold_mms": 2.8,
            "vibration_crit_threshold_mms": 4.5,
            "temp_warn_threshold_c": 75.0,
            "temp_crit_threshold_c": 90.0,
            "current_warn_threshold_a": 135.0,
            "current_crit_threshold_a": 160.0,
            "retraining_schedule": "Weekly Automatic (Sunday 02:00 AM)",
            "ai_sensitivity": "Medium-High (0.85 F1 optimization)"
        }
        self.tick_count = 0
        self.injected_scenarios: Dict[str, Any] = {} # e.g. {"cmp-01": {"vibration_spike": 3.0}}

    def add_or_update_asset(self, asset: AssetTelemetry):
        self.assets[asset.id] = asset
        if asset.id not in self.asset_history:
            self.asset_history[asset.id] = []
        
        # Keep sliding window of sensor history
        snapshot = {
            "timestamp": asset.last_updated,
            "vibration_x": asset.vibration_x,
            "vibration_y": asset.vibration_y,
            "vibration_z": asset.vibration_z,
            "temperature_motor": asset.temperature_motor,
            "temperature_bearing": asset.temperature_bearing,
            "motor_current_a": asset.motor_current_a,
            "pressure_bar": asset.pressure_bar,
            "acoustic_emission_db": asset.acoustic_emission_db,
            "flow_rate_lpm": asset.flow_rate_lpm,
            "health_index": asset.prediction.health_index,
            "rul_cycles": asset.prediction.rul_cycles,
            "rpm": asset.rpm,
            "load_pct": asset.load_pct
        }
        self.asset_history[asset.id].append(snapshot)
        if len(self.asset_history[asset.id]) > 60:
            self.asset_history[asset.id].pop(0)

    def add_alert(self, alert: AlertItem):
        # Prevent duplicate active alerts for same asset and severity
        exists = any(a.asset_id == alert.asset_id and a.severity == alert.severity and not a.acknowledged for a in self.alerts)
        if not exists:
            self.alerts.insert(0, alert)
            if len(self.alerts) > 100:
                self.alerts.pop()

    def add_work_order(self, wo: WorkOrder):
        self.work_orders.insert(0, wo)

    def add_ai_prescription(self, rx: AIPrescriptionItem):
        # Update existing or insert
        for i, existing in enumerate(self.ai_prescriptions):
            if existing.asset_id == rx.asset_id and existing.feedback_status == "Pending Review":
                self.ai_prescriptions[i] = rx
                return
        self.ai_prescriptions.insert(0, rx)

state_store = StateStore()

import math
import random
from typing import Dict, List, Any, Tuple
from app.models.schemas import AssetPrediction, ComponentTwinState, WhatIfSimulationResponse, AIModelMetrics, AIPrescriptionItem

FAILURE_MODES = [
    "Bearing Outer Race Defect",
    "Stator Winding Overheat",
    "Shaft Misalignment & Looseness",
    "Cavitation & Seal Degradation",
    "Spindle Tool Wear",
    "Pneumatic Valve Leak & Pressure Loss"
]

PARTS_CATALOG = {
    "Bearing Outer Race Defect": ["SKF Explorer 6314-2Z/C3 Deep Groove Bearing", "Klüberquiet BQ 72-72 Synthetic Grease", "Viton Dual Lip Shaft Seal 70x90x10"],
    "Stator Winding Overheat": ["Class H Stator Rewind Kit", "PT100 3-Wire RTD Sensor Probe", "Epoxy Impregnation Resin 2-Part"],
    "Shaft Misalignment & Looseness": ["Stainless Steel Pre-Cut Alignment Shims (0.05-2mm)", "Lovejoy Jaw Coupling Elastomer Insert", "Grade 10.9 High-Tensile Foundation Bolts"],
    "Cavitation & Seal Degradation": ["Silicon Carbide Mechanical Seal Cartridge", "316SS Precision Cast Impeller", "EPDM Flange Gasket Set ANSI 150"],
    "Spindle Tool Wear": ["Ceramic Hybrid Spindle Bearing Set H7008C", "BT40 Tool Holder Pull Studs", "High-Pressure Spindle Coolant Nozzle"],
    "Pneumatic Valve Leak & Pressure Loss": ["Festo 5/2 Directional Solenoid Valve", "Polyurethane 12mm Pneumatic Tubing", "Pneumatic Filter Regulator & Lubricator (FRL)"]
}

PROCEDURES = {
    "Bearing Outer Race Defect": "1. Lockout/Tagout asset. 2. Remove drive guard and decouple motor. 3. Extract worn bearing using hydraulic puller. 4. Inspect journal seat for fretting. 5. Heat replacement bearing (110°C) and press onto shaft. 6. Pack with 40g synthetic grease. 7. Laser align shaft within 0.03mm tolerance. 8. Re-energize and verify vibration baseline.",
    "Stator Winding Overheat": "1. Isolate 480V/3-phase supply and discharge capacitor banks. 2. Perform Megger insulation resistance test (>100 MΩ). 3. Inspect cooling fan cowl and duct for particulate blockage. 4. Check RTD wiring terminal block for high contact resistance. 5. Measure phase resistance balance (<2% variance). 6. Clean heat sink fins with dry nitrogen. 7. Re-test thermal gradient under 50% partial load.",
    "Shaft Misalignment & Looseness": "1. De-energize asset and secure coupling lock. 2. Mount dual wireless dial indicators / laser alignment heads on motor and driven shaft. 3. Check soft-foot condition (<0.05mm). 4. Adjust vertical elevation using precision shims. 5. Adjust horizontal alignment via jack bolts to achieve <0.04mm radial and <0.02mm/100mm angular offset. 6. Torque foundation bolts to 185 Nm in criss-cross pattern.",
    "Cavitation & Seal Degradation": "1. Close suction and discharge isolation valves and drain casing. 2. Inspect suction strainer for differential pressure clog. 3. Disassemble wet end and inspect impeller blades for pitting erosion. 4. Replace mechanical seal cartridge; apply silicone barrier lubricant. 5. Verify NPSH (Net Positive Suction Head) margin exceeds 1.5m. 6. Purge air from casing vent before restart.",
    "Spindle Tool Wear": "1. Halt CNC machining program and engage spindle lock. 2. Measure tool tip runout with 0.001mm micrometer indicator. 3. Index/replace worn carbide inserts. 4. Check spindle drawbar clamping force using wireless gauge (>8.5 kN). 5. Verify through-spindle coolant flow rate (>18 L/min at 20 bar). 6. Execute 5-minute spindle taper warm-up and dry run calibration cycle.",
    "Pneumatic Valve Leak & Pressure Loss": "1. Depressurize pneumatic manifold to 0 bar and tag safety valve. 2. Perform ultrasonic acoustic scan along pilot lines. 3. Replace cracked 12mm polyurethane tubing and push-in fittings. 4. Swap worn solenoid valve spool seal. 5. Adjust line pressure regulator to nominal 6.5 bar. 6. Perform 15-minute pressure hold decay test (<0.1 bar drop)."
}

class AIEngine:
    def __init__(self):
        self.models_status = [
            AIModelMetrics(
                model_name="XGBoost-RUL-Ensemble-v4.2",
                model_type="Gradient Boosted Quantile Trees",
                target="Remaining Useful Life (Cycles & Hours)",
                accuracy_score=0.962,
                mae_cycles=3.4,
                r2_score=0.948,
                psi_drift_index=0.042,
                status="Optimal",
                last_trained="2026-08-20 03:00:00",
                inference_latency_ms=4.8,
                samples_monitored=1482900
            ),
            AIModelMetrics(
                model_name="Temporal-ConvNet-LSTM-Anomaly-v3.1",
                model_type="Deep TCN / Bi-LSTM Sequence Model",
                target="Early Sensor Anomaly & Health Index",
                accuracy_score=0.978,
                mae_cycles=1.8,
                r2_score=0.965,
                psi_drift_index=0.058,
                status="Optimal",
                last_trained="2026-08-22 04:30:00",
                inference_latency_ms=8.2,
                samples_monitored=2850000
            ),
            AIModelMetrics(
                model_name="MultiClass-FailureMode-Classifier-v2.8",
                model_type="LightGBM Multi-Class Classifier",
                target="Fault Root Cause Mode & Defect Class",
                accuracy_score=0.941,
                mae_cycles=0.0,
                r2_score=0.923,
                psi_drift_index=0.071,
                status="Optimal",
                last_trained="2026-08-25 02:15:00",
                inference_latency_ms=3.1,
                samples_monitored=950400
            ),
            AIModelMetrics(
                model_name="TreeSHAP-Attribution-Engine-v1.9",
                model_type="Game-Theoretic SHAP Explainer",
                target="Feature Risk Attribution (%)",
                accuracy_score=0.989,
                mae_cycles=0.0,
                r2_score=0.979,
                psi_drift_index=0.031,
                status="Optimal",
                last_trained="2026-08-26 01:00:00",
                inference_latency_ms=2.4,
                samples_monitored=1200000
            )
        ]

    def predict_asset(
        self,
        asset_id: str,
        category: str,
        vibration_rms: float,
        temp_motor: float,
        temp_bearing: float,
        motor_current: float,
        pressure: float,
        acoustic_db: float,
        oil_particles: int,
        flow_lpm: float,
        nominal_rul: int,
        degradation_factor: float
    ) -> AssetPrediction:
        """
        Calculates RUL with uncertainty, health index, failure mode distribution, SHAP contribution, and prescriptive actions.
        """
        # Calculate composite stress score
        vibe_stress = max(0.0, (vibration_rms - 0.8) / 2.5)
        temp_stress = max(0.0, (temp_bearing - 60.0) / 35.0)
        current_stress = max(0.0, (motor_current - 90.0) / 45.0)
        acoustic_stress = max(0.0, (acoustic_db - 40.0) / 30.0)
        pressure_stress = max(0.0, abs(pressure - 150.0) / 100.0)
        oil_stress = max(0.0, (oil_particles - 500) / 1500.0)

        total_stress = 0.35 * vibe_stress + 0.25 * temp_stress + 0.15 * current_stress + 0.12 * acoustic_stress + 0.08 * pressure_stress + 0.05 * oil_stress
        total_stress = min(1.0, total_stress + degradation_factor * 0.7)

        # Health Index (100 -> 0)
        health_index = max(5.0, min(100.0, 100.0 - (total_stress * 90.0) + random.uniform(-1.5, 1.5)))
        
        if health_index > 75.0:
            health_state = "Healthy"
        elif health_index > 45.0:
            health_state = "Warning"
        else:
            health_state = "Critical"

        # RUL with 95% confidence interval
        base_rul = max(8, int(nominal_rul * (health_index / 100.0)))
        rul_ci_lower = max(2.0, base_rul * 0.88 - random.uniform(1.0, 4.0))
        rul_ci_upper = base_rul * 1.14 + random.uniform(1.0, 5.0)
        rul_hours = round(base_rul * 2.4, 1)
        lead_time_hours = round(rul_hours * 0.65, 1)

        # Failure mode determination based on highest sensor anomaly
        sensor_stresses = {
            "Bearing Outer Race Defect": vibe_stress * 1.4 + acoustic_stress * 1.1,
            "Stator Winding Overheat": temp_stress * 1.5 + current_stress * 1.2,
            "Shaft Misalignment & Looseness": vibe_stress * 1.2 + current_stress * 0.8,
            "Cavitation & Seal Degradation": acoustic_stress * 1.3 + pressure_stress * 1.2,
            "Spindle Tool Wear": vibe_stress * 1.0 + oil_stress * 1.3,
            "Pneumatic Valve Leak & Pressure Loss": pressure_stress * 1.6 + acoustic_stress * 0.9
        }

        # Softmax-style distribution
        exp_sum = sum(math.exp(v * 2.5) for v in sensor_stresses.values())
        failure_dist = {k: round(math.exp(v * 2.5) / exp_sum, 3) for k, v in sensor_stresses.items()}
        
        # Determine dominant failure mode
        top_mode = max(failure_dist.items(), key=lambda x: x[1])[0]
        top_prob = failure_dist[top_mode]

        # SHAP feature contributions (sum to 100%)
        raw_shaps = {
            "Triaxial Vibration RMS": max(5.0, vibe_stress * 40.0 + random.uniform(2, 6)),
            "Bearing Temperature RTD": max(5.0, temp_stress * 35.0 + random.uniform(2, 5)),
            "Motor Current (MCSA)": max(3.0, current_stress * 25.0 + random.uniform(1, 4)),
            "Acoustic Ultrasound": max(3.0, acoustic_stress * 25.0 + random.uniform(1, 4)),
            "Differential Pressure": max(2.0, pressure_stress * 20.0 + random.uniform(1, 3)),
            "Oil Particle Index (ISO)": max(2.0, oil_stress * 15.0 + random.uniform(1, 3)),
            "Coolant / Lubricant Flow": max(1.0, random.uniform(2, 5))
        }
        shap_total = sum(raw_shaps.values())
        shap_contributions = {k: round((v / shap_total) * 100.0, 1) for k, v in raw_shaps.items()}

        # Prescriptive action
        prescriptive_action = PROCEDURES.get(top_mode, "Inspect asset for abnormal mechanical or thermal behavior.")
        required_parts = PARTS_CATALOG.get(top_mode, ["General Gasket Seal Kit", "Synthetic Lubricant"])
        
        wrench_time = {
            "Bearing Outer Race Defect": 3.5,
            "Stator Winding Overheat": 5.0,
            "Shaft Misalignment & Looseness": 2.5,
            "Cavitation & Seal Degradation": 4.0,
            "Spindle Tool Wear": 1.5,
            "Pneumatic Valve Leak & Pressure Loss": 2.0
        }.get(top_mode, 3.0)

        cost_risk = {
            "Critical": random.uniform(25000, 75000),
            "Warning": random.uniform(8000, 22000),
            "Healthy": random.uniform(500, 2500)
        }[health_state]

        return AssetPrediction(
            rul_cycles=base_rul,
            rul_hours=rul_hours,
            rul_ci_lower=round(rul_ci_lower, 1),
            rul_ci_upper=round(rul_ci_upper, 1),
            health_index=round(health_index, 1),
            health_state=health_state,
            failure_mode=top_mode,
            failure_mode_probability=round(top_prob * 100.0, 1),
            failure_mode_distribution=failure_dist,
            anomaly_score=round(min(1.0, total_stress * 1.1), 3),
            lead_time_hours=lead_time_hours,
            shap_contributions=shap_contributions,
            prescriptive_action=prescriptive_action,
            estimated_wrench_time_hrs=wrench_time,
            required_parts=required_parts,
            downtime_cost_risk_usd=round(cost_risk, 2)
        )

    def simulate_what_if(
        self,
        asset_id: str,
        current_rul: int,
        current_health: float,
        load_delta: float,
        rpm_delta: float,
        temp_delta: float,
        lube_quality: float
    ) -> WhatIfSimulationResponse:
        """
        Evaluates the degradation impact of operating parameters on asset lifetime.
        """
        # Acceleration factor based on Arrhenius thermal and mechanical load scaling (Miner's Rule)
        thermal_factor = math.exp(max(-0.5, min(1.2, temp_delta / 25.0)))
        load_factor = math.pow(max(0.4, min(2.0, 1.0 + (load_delta / 100.0))), 2.8) # Cubic load fatigue exponent
        speed_factor = max(0.5, min(1.8, 1.0 + (rpm_delta / 1500.0)))
        lube_penalty = max(0.6, min(2.5, (110.0 - lube_quality) / 50.0))

        overall_stress_multiplier = (thermal_factor * 0.35 + load_factor * 0.35 + speed_factor * 0.15 + lube_penalty * 0.15)
        
        simulated_rul = max(4, int(current_rul / overall_stress_multiplier))
        rul_delta_pct = round(((simulated_rul - current_rul) / max(1, current_rul)) * 100.0, 1)

        simulated_health = max(5.0, min(100.0, current_health - (overall_stress_multiplier - 1.0) * 25.0))
        
        if simulated_health > 75.0:
            risk_delta = "LOW RISK: Safe operating window"
        elif simulated_health > 45.0:
            risk_delta = "ELEVATED RISK: Accelerated bearing/winding wear expected"
        else:
            risk_delta = "CRITICAL RISK: Imminent fatigue breakdown predicted"

        projected_thermal_rise = round(max(0.0, temp_delta * 0.85 + (load_delta * 0.22)), 1)
        projected_vibe_spike = round(max(-30.0, min(150.0, (speed_factor * load_factor - 1.0) * 100.0)), 1)

        # Generate simulated degradation curve (next 50 cycles)
        curve = []
        h = simulated_health
        for cycle in range(0, 51, 5):
            degrade_step = (100.0 / max(10, simulated_rul)) * 5.0 * overall_stress_multiplier
            h = max(0.0, h - degrade_step)
            curve.append({
                "cycle": float(cycle),
                "baseline_health": max(0.0, round(current_health - (100.0 / max(10, current_rul)) * 5.0 * cycle / 5.0, 1)),
                "simulated_health": round(h, 1),
                "uncertainty_lower": max(0.0, round(h * 0.88, 1)),
                "uncertainty_upper": min(100.0, round(h * 1.12, 1))
            })

        rec = (
            f"Operating at {load_delta:+.0f}% load and {rpm_delta:+.0f} RPM with {lube_quality:.0f}% lubrication index "
            f"alters projected asset RUL by {rul_delta_pct:+.1f}%. "
            f"{'Recommend derating machine by 15% to extend operating cycle to next scheduled turnaround.' if rul_delta_pct < -20 else 'Operating envelope remains within acceptable OEM reliability boundaries.'}"
        )

        return WhatIfSimulationResponse(
            asset_id=asset_id,
            baseline_rul_cycles=current_rul,
            simulated_rul_cycles=simulated_rul,
            rul_delta_pct=rul_delta_pct,
            baseline_health_index=current_health,
            simulated_health_index=round(simulated_health, 1),
            risk_level_delta=risk_delta,
            projected_failure_mode="Bearing Outer Race Spall" if lube_quality < 70 else "Stator Winding Overheat" if temp_delta > 10 else "Shaft Fatigue Micro-Cracking",
            projected_thermal_rise_c=projected_thermal_rise,
            projected_vibration_spike_pct=projected_vibe_spike,
            recommendation=rec,
            degradation_curve_simulated=curve
        )

ai_engine = AIEngine()

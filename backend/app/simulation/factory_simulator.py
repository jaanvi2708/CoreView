import math
import random
import time
from datetime import datetime
from typing import Dict, List, Any
from app.models.schemas import (
    AssetTelemetry, ComponentTwinState, ZoneSummary, AlertItem, WorkOrder,
    AIPrescriptionItem, FactoryOverview
)
from app.services.ai_engine import ai_engine
from app.services.state_store import state_store

# Factory Zones Configuration
ZONES_CONFIG = [
    {
        "id": "production",
        "name": "Production & Machining Lines",
        "description": "High-precision CNC 5-axis milling centers, automated hydraulic stamping presses, and robotic assembly cells.",
        "supervisor": "[OP-01]",
        "schematic_type": "production_cell_layout"
    },
    {
        "id": "packaging",
        "name": "Packaging & Bottling Line",
        "description": "High-speed horizontal flow wrapping, automated carton formers, and robotic palletizing cells.",
        "supervisor": "[OP-02]",
        "schematic_type": "packaging_conveyor_layout"
    },
    {
        "id": "warehouse",
        "name": "Warehouse & Logistics (AS/RS)",
        "description": "Automated High-Bay Storage and Retrieval Systems (AS/RS), automated sorting diverters, and AGV fleet.",
        "supervisor": "[OP-03]",
        "schematic_type": "asrs_racking_layout"
    },
    {
        "id": "utilities",
        "name": "Utilities, Power & Plant HVAC",
        "description": "Heavy industrial centrifugal air compressors, 500TR water chillers, steam boilers, and high-voltage substations.",
        "supervisor": "[ENG-04]",
        "schematic_type": "utilities_scada_layout"
    },
    {
        "id": "quality",
        "name": "Quality Assurance & Metrology",
        "description": "Automated AI vision inspection gantries, high-precision laser micrometers, and ultrasonic NDT scanners.",
        "supervisor": "[QA-05]",
        "schematic_type": "qa_inspection_layout"
    }
]

# Assets Template Configuration
ASSETS_CONFIG = [
    # Utilities Zone
    {
        "id": "cmp-01",
        "name": "Centrifugal Air Compressor 01 (250kW)",
        "zone_id": "utilities",
        "category": "compressor",
        "nominal_rpm": 2980.0,
        "nominal_power_kw": 245.0,
        "nominal_rul": 160,
        "base_temp": 78.0,
        "base_vibe": 1.25,
        "base_pressure": 7.4,
        "base_current": 142.0,
        "base_acoustic": 54.0,
        "degradation_rate": 0.35, # Progressively degrades to showcase predictive alerts
        "components": [
            {"id": "cmp01-motor", "name": "3-Phase Induction Motor (250kW)", "component_type": "motor"},
            {"id": "cmp01-drive-brg", "name": "Drive-End Spherical Roller Bearing", "component_type": "bearing"},
            {"id": "cmp01-volute", "name": "Cast Steel Volute & High-Pressure Casing", "component_type": "impeller"},
            {"id": "cmp01-shaft", "name": "Forged Alloy Main Drive Shaft & Coupling", "component_type": "shaft"},
            {"id": "cmp01-valves", "name": "Electro-Pneumatic Unloader Valve Block", "component_type": "valve"}
        ]
    },
    {
        "id": "cmp-02",
        "name": "Screw Booster Air Compressor 02",
        "zone_id": "utilities",
        "category": "compressor",
        "nominal_rpm": 3600.0,
        "nominal_power_kw": 110.0,
        "nominal_rul": 310,
        "base_temp": 64.0,
        "base_vibe": 0.45,
        "base_pressure": 9.2,
        "base_current": 72.0,
        "base_acoustic": 38.0,
        "degradation_rate": 0.05,
        "components": [
            {"id": "cmp02-motor", "name": "Primary Drive Motor", "component_type": "motor"},
            {"id": "cmp02-rotors", "name": "Twin Helical Screws", "component_type": "impeller"},
            {"id": "cmp02-brg", "name": "Thrust Bearings", "component_type": "bearing"}
        ]
    },
    {
        "id": "chl-01",
        "name": "Industrial Chilled Water Chiller (500 TR)",
        "zone_id": "utilities",
        "category": "chiller",
        "nominal_rpm": 1780.0,
        "nominal_power_kw": 380.0,
        "nominal_rul": 240,
        "base_temp": 52.0,
        "base_vibe": 0.62,
        "base_pressure": 4.8,
        "base_current": 215.0,
        "base_acoustic": 44.0,
        "degradation_rate": 0.12,
        "components": [
            {"id": "chl01-comp", "name": "Semi-Hermetic Screw Compressor", "component_type": "motor"},
            {"id": "chl01-evap", "name": "Shell & Tube Evaporator", "component_type": "valve"},
            {"id": "chl01-cond", "name": "Water-Cooled Condenser Unit", "component_type": "impeller"},
            {"id": "chl01-exp", "name": "Electronic Expansion Valve", "component_type": "valve"}
        ]
    },
    {
        "id": "blr-01",
        "name": "High-Pressure Steam Boiler 10-Bar",
        "zone_id": "utilities",
        "category": "compressor",
        "nominal_rpm": 1450.0,
        "nominal_power_kw": 95.0,
        "nominal_rul": 420,
        "base_temp": 182.0,
        "base_vibe": 0.38,
        "base_pressure": 10.2,
        "base_current": 58.0,
        "base_acoustic": 34.0,
        "degradation_rate": 0.04,
        "components": [
            {"id": "blr01-burner", "name": "Modulating Gas Burner Head", "component_type": "valve"},
            {"id": "blr01-pump", "name": "Feedwater Multi-Stage Pump", "component_type": "impeller"},
            {"id": "blr01-drum", "name": "Steam Header Pressure Drum", "component_type": "valve"}
        ]
    },
    {
        "id": "tx-01",
        "name": "Main HV Transformer Substation 33kV",
        "zone_id": "utilities",
        "category": "compressor",
        "nominal_rpm": 0.0,
        "nominal_power_kw": 1250.0,
        "nominal_rul": 550,
        "base_temp": 68.0,
        "base_vibe": 0.15,
        "base_pressure": 1.2,
        "base_current": 420.0,
        "base_acoustic": 28.0,
        "degradation_rate": 0.02,
        "components": [
            {"id": "tx01-core", "name": "Silicon Laminated Magnetic Core", "component_type": "motor"},
            {"id": "tx01-tap", "name": "On-Load Tap Changer (OLTC)", "component_type": "valve"},
            {"id": "tx01-rad", "name": "Oil Cooling Radiator Matrix", "component_type": "impeller"}
        ]
    },

    # Production Zone
    {
        "id": "cnc-01",
        "name": "5-Axis CNC Milling Center 01 (DMG Mori)",
        "zone_id": "production",
        "category": "cnc_mill",
        "nominal_rpm": 18000.0,
        "nominal_power_kw": 45.0,
        "nominal_rul": 78,
        "base_temp": 72.0,
        "base_vibe": 2.15,
        "base_pressure": 22.0,
        "base_current": 64.0,
        "base_acoustic": 62.0,
        "degradation_rate": 0.42, # Warning asset
        "components": [
            {"id": "cnc01-spindle", "name": "High-Speed Electro-Spindle (20,000 RPM)", "component_type": "spindle"},
            {"id": "cnc01-bearing", "name": "Ceramic Hybrid Angular Contact Bearings", "component_type": "bearing"},
            {"id": "cnc01-tooling", "name": "Automatic Tool Changer (40-Pocket BT40)", "component_type": "gearbox"},
            {"id": "cnc01-drives", "name": "X/Y/Z Precision Ball Screw Servo Drives", "component_type": "shaft"},
            {"id": "cnc01-coolant", "name": "High-Pressure Through-Spindle Coolant Pump", "component_type": "impeller"}
        ]
    },
    {
        "id": "cnc-02",
        "name": "5-Axis CNC Milling Center 02",
        "zone_id": "production",
        "category": "cnc_mill",
        "nominal_rpm": 15000.0,
        "nominal_power_kw": 40.0,
        "nominal_rul": 380,
        "base_temp": 46.0,
        "base_vibe": 0.42,
        "base_pressure": 19.5,
        "base_current": 48.0,
        "base_acoustic": 36.0,
        "degradation_rate": 0.04,
        "components": [
            {"id": "cnc02-spindle", "name": "Main Milling Spindle", "component_type": "spindle"},
            {"id": "cnc02-bearing", "name": "Spindle Support Bearings", "component_type": "bearing"},
            {"id": "cnc02-drives", "name": "Linear Guideway Axes", "component_type": "shaft"}
        ]
    },
    {
        "id": "prs-01",
        "name": "Hydraulic Stamping Press 500T",
        "zone_id": "production",
        "category": "stamping_press",
        "nominal_rpm": 120.0,
        "nominal_power_kw": 160.0,
        "nominal_rul": 190,
        "base_temp": 62.0,
        "base_vibe": 1.10,
        "base_pressure": 280.0,
        "base_current": 130.0,
        "base_acoustic": 58.0,
        "degradation_rate": 0.18,
        "components": [
            {"id": "prs01-cyl", "name": "Main 500-Ton Hydraulic Ram Cylinder", "component_type": "valve"},
            {"id": "prs01-pump", "name": "Variable Displacement Piston Pump Unit", "component_type": "impeller"},
            {"id": "prs01-die", "name": "Upper Die Clamping Plate & Guide Bushings", "component_type": "shaft"}
        ]
    },
    {
        "id": "rob-01",
        "name": "6-Axis Heavy Robotic Assembly Cell",
        "zone_id": "production",
        "category": "robotic_arm",
        "nominal_rpm": 60.0,
        "nominal_power_kw": 32.0,
        "nominal_rul": 310,
        "base_temp": 48.0,
        "base_vibe": 0.35,
        "base_pressure": 6.2,
        "base_current": 28.0,
        "base_acoustic": 32.0,
        "degradation_rate": 0.06,
        "components": [
            {"id": "rob01-j1", "name": "Base & Waist Harmonic Drive Gearbox J1", "component_type": "gearbox"},
            {"id": "rob01-j2", "name": "Shoulder Articulation Servo Actuator J2", "component_type": "motor"},
            {"id": "rob01-j3", "name": "Elbow Flex Pivot Joint J3", "component_type": "motor"},
            {"id": "rob01-wrist", "name": "3-Axis Precision Wrist & End-Effector", "component_type": "gearbox"}
        ]
    },

    # Packaging Zone
    {
        "id": "wrp-01",
        "name": "High-Speed Flow Packaging Wrapper",
        "zone_id": "packaging",
        "category": "flow_wrapper",
        "nominal_rpm": 320.0,
        "nominal_power_kw": 28.0,
        "nominal_rul": 115,
        "base_temp": 145.0, # Seal jaw temp
        "base_vibe": 0.95,
        "base_pressure": 6.0,
        "base_current": 34.0,
        "base_acoustic": 42.0,
        "degradation_rate": 0.22,
        "components": [
            {"id": "wrp01-motor", "name": "Synchronous Servo Infeed Drive Motor", "component_type": "motor"},
            {"id": "wrp01-seal", "name": "Rotary Longitudinal & Transverse Heat Sealer", "component_type": "valve"},
            {"id": "wrp01-knife", "name": "High-Speed Precision Rotary Cutting Anvil", "component_type": "spindle"},
            {"id": "wrp01-belt", "name": "Variable Speed Infeed Lug Conveyor Belt", "component_type": "belt"}
        ]
    },
    {
        "id": "plt-01",
        "name": "Robotic Gantry Palletizer 01",
        "zone_id": "packaging",
        "category": "robotic_arm",
        "nominal_rpm": 90.0,
        "nominal_power_kw": 42.0,
        "nominal_rul": 290,
        "base_temp": 50.0,
        "base_vibe": 0.55,
        "base_pressure": 6.5,
        "base_current": 46.0,
        "base_acoustic": 35.0,
        "degradation_rate": 0.07,
        "components": [
            {"id": "plt01-hoist", "name": "Vertical Hoist Lift Belt & Drive Pulley", "component_type": "belt"},
            {"id": "plt01-gripper", "name": "Pneumatic Matrix Vacuum Gripper Head", "component_type": "valve"},
            {"id": "plt01-motor", "name": "Longitudinal Gantry Traverse Drive", "component_type": "motor"}
        ]
    },
    {
        "id": "crt-01",
        "name": "Automated Cartoning Machine",
        "zone_id": "packaging",
        "category": "flow_wrapper",
        "nominal_rpm": 180.0,
        "nominal_power_kw": 22.0,
        "nominal_rul": 340,
        "base_temp": 55.0,
        "base_vibe": 0.48,
        "base_pressure": 5.8,
        "base_current": 26.0,
        "base_acoustic": 38.0,
        "degradation_rate": 0.05,
        "components": [
            {"id": "crt01-feeder", "name": "Rotary Carton Magazine Feeder", "component_type": "gearbox"},
            {"id": "crt01-glue", "name": "Hot Melt Adhesive Glue Applicator", "component_type": "valve"}
        ]
    },

    # Warehouse Zone
    {
        "id": "asrs-01",
        "name": "Automated High-Bay Stacker Crane 01",
        "zone_id": "warehouse",
        "category": "asrs_crane",
        "nominal_rpm": 1450.0,
        "nominal_power_kw": 75.0,
        "nominal_rul": 130,
        "base_temp": 56.0,
        "base_vibe": 1.45,
        "base_pressure": 0.0,
        "base_current": 88.0,
        "base_acoustic": 46.0,
        "degradation_rate": 0.25,
        "components": [
            {"id": "asrs01-travel", "name": "Floor Rail Travel Wheel Gearmotor & Brake", "component_type": "gearbox"},
            {"id": "asrs01-hoist", "name": "Twin Mast Cable Hoist Drum & Wire Rope", "component_type": "belt"},
            {"id": "asrs01-fork", "name": "Telescopic Deep-Lane Shuttle Forks", "component_type": "shaft"},
            {"id": "asrs01-mast", "name": "Structural Steel Lattice Mast Column", "component_type": "bearing"}
        ]
    },
    {
        "id": "asrs-02",
        "name": "Automated High-Bay Stacker Crane 02",
        "zone_id": "warehouse",
        "category": "asrs_crane",
        "nominal_rpm": 1450.0,
        "nominal_power_kw": 75.0,
        "nominal_rul": 410,
        "base_temp": 44.0,
        "base_vibe": 0.38,
        "base_pressure": 0.0,
        "base_current": 62.0,
        "base_acoustic": 30.0,
        "degradation_rate": 0.03,
        "components": [
            {"id": "asrs02-travel", "name": "Travel Drive Motor", "component_type": "motor"},
            {"id": "asrs02-hoist", "name": "Vertical Hoist Drive", "component_type": "belt"},
            {"id": "asrs02-fork", "name": "Telescopic Forks", "component_type": "shaft"}
        ]
    },
    {
        "id": "cnv-01",
        "name": "High-Speed Parcel Sorting Conveyor Loop",
        "zone_id": "warehouse",
        "category": "flow_wrapper",
        "nominal_rpm": 450.0,
        "nominal_power_kw": 35.0,
        "nominal_rul": 280,
        "base_temp": 48.0,
        "base_vibe": 0.52,
        "base_pressure": 6.2,
        "base_current": 42.0,
        "base_acoustic": 36.0,
        "degradation_rate": 0.08,
        "components": [
            {"id": "cnv01-drum", "name": "Head Drive Motorized Drum Pulley", "component_type": "motor"},
            {"id": "cnv01-divert", "name": "High-Speed Pneumatic Pop-Up Diverter Wheels", "component_type": "valve"}
        ]
    },
    {
        "id": "agv-01",
        "name": "Autonomous Guided Vehicle Fleet Master",
        "zone_id": "warehouse",
        "category": "robotic_arm",
        "nominal_rpm": 220.0,
        "nominal_power_kw": 12.0,
        "nominal_rul": 350,
        "base_temp": 38.0,
        "base_vibe": 0.28,
        "base_pressure": 0.0,
        "base_current": 24.0,
        "base_acoustic": 25.0,
        "degradation_rate": 0.04,
        "components": [
            {"id": "agv01-drive", "name": "Dual Differential Wheel Drive Motors", "component_type": "motor"},
            {"id": "agv01-lidar", "name": "Safety LiDAR & Navigation Scanner", "component_type": "spindle"}
        ]
    },

    # Quality Zone
    {
        "id": "vsn-01",
        "name": "AI Vision Defect Inspection Gantry",
        "zone_id": "quality",
        "category": "cnc_mill",
        "nominal_rpm": 0.0,
        "nominal_power_kw": 8.5,
        "nominal_rul": 390,
        "base_temp": 42.0,
        "base_vibe": 0.18,
        "base_pressure": 5.5,
        "base_current": 14.0,
        "base_acoustic": 22.0,
        "degradation_rate": 0.05,
        "components": [
            {"id": "vsn01-cam", "name": "4K High-Speed Area Scan CMOS Cameras", "component_type": "spindle"},
            {"id": "vsn01-led", "name": "Multispectral LED Strobe Illumination Array", "component_type": "valve"},
            {"id": "vsn01-eject", "name": "High-Speed Pneumatic Defect Rejection Blowoff", "component_type": "valve"}
        ]
    },
    {
        "id": "lsr-01",
        "name": "Laser Micrometer 3D Metrology Gauge",
        "zone_id": "quality",
        "category": "cnc_mill",
        "nominal_rpm": 0.0,
        "nominal_power_kw": 5.2,
        "nominal_rul": 440,
        "base_temp": 35.0,
        "base_vibe": 0.12,
        "base_pressure": 0.0,
        "base_current": 8.0,
        "base_acoustic": 18.0,
        "degradation_rate": 0.02,
        "components": [
            {"id": "lsr01-head", "name": "Blue Diode Telecentric Laser Sensor Head", "component_type": "spindle"},
            {"id": "lsr01-stage", "name": "Air Bearing Precision Linear Translation Stage", "component_type": "shaft"}
        ]
    }
]

# Pre-populate some realistic initial Work Orders
INITIAL_WORK_ORDERS = [
    WorkOrder(
        id="WO-8921",
        title="CMP-01 Drive-End Bearing Vibration Diagnostic & Regreasing",
        asset_id="cmp-01",
        asset_name="Centrifugal Air Compressor 01 (250kW)",
        zone_id="utilities",
        zone_name="Utilities, Power & Plant HVAC",
        priority="P2 - High",
        status="In Progress",
        created_at="2026-08-27 08:30:00",
        assigned_to="Dave Miller (Senior Millwright)",
        assigned_technician_role="Level III Vibration Analyst",
        scheduled_start="2026-08-27 15:00:00",
        estimated_hours=3.5,
        actual_hours=1.8,
        prescriptive_procedure="1. Isolate 250kW motor feed. 2. Ultrasonic bearing scan. 3. Purge old grease and inject 40g Klüberquiet BQ 72-72. 4. Verify spectral harmonics at 1x/2x shaft rotational frequency.",
        required_parts=["SKF Explorer 6314-2Z/C3 Deep Groove Bearing", "Klüberquiet BQ 72-72 Synthetic Grease"],
        parts_status="Reserved",
        estimated_cost_usd=1850.0,
        actual_cost_usd=420.0,
        source_alert_id="ALT-1042",
        notes=["Technician on site at compressor room.", "Pre-grease vibration RMS was 3.12 mm/s."]
    ),
    WorkOrder(
        id="WO-8920",
        title="CNC-01 Spindle Taper Runout & Coolant Nozzle Alignment",
        asset_id="cnc-01",
        asset_name="5-Axis CNC Milling Center 01 (DMG Mori)",
        zone_id="production",
        zone_name="Production & Machining Lines",
        priority="P2 - High",
        status="Assigned",
        created_at="2026-08-27 10:15:00",
        assigned_to="Kenji Sato (CNC Specialist)",
        assigned_technician_role="Precision Machine Tool Technician",
        scheduled_start="2026-08-27 18:00:00",
        estimated_hours=2.0,
        prescriptive_procedure="1. Halt program execution. 2. Measure spindle drawbar retention force (>8.5 kN). 3. Clean ceramic hybrid bearing raceway. 4. Test run 5-axis calibration artifact.",
        required_parts=["BT40 Tool Holder Pull Studs", "Spindle Coolant Nozzle Kit"],
        parts_status="In Stock",
        estimated_cost_usd=1200.0,
        source_alert_id="ALT-1038",
        notes=["Scheduled for shift handover window."]
    ),
    WorkOrder(
        id="WO-8919",
        title="WRP-01 Rotary Heat Sealing Bar Calrod Replacement",
        asset_id="wrp-01",
        asset_name="High-Speed Flow Packaging Wrapper",
        zone_id="packaging",
        zone_name="Packaging & Bottling Line",
        priority="P3 - Medium",
        status="Completed",
        created_at="2026-08-26 14:00:00",
        assigned_to="Carlos Mendez",
        assigned_technician_role="Electrical Controls Technician",
        scheduled_start="2026-08-26 16:00:00",
        estimated_hours=2.5,
        actual_hours=2.2,
        prescriptive_procedure="1. LOTO seal bar supply. 2. Replace RTD thermocouple element. 3. Adjust PID loop deadband.",
        required_parts=["PT100 3-Wire RTD Sensor Probe"],
        parts_status="In Stock",
        estimated_cost_usd=650.0,
        actual_cost_usd=580.0,
        source_alert_id="ALT-1025",
        notes=["Work completed successfully. Seal temperature stability restored to ±0.8°C."]
    )
]

class FactorySimulator:
    def __init__(self):
        self.tick = 0
        self.initialize_store()

    def initialize_store(self):
        # Initialize work orders
        for wo in INITIAL_WORK_ORDERS:
            state_store.add_work_order(wo)

        # Initial pass across all assets
        self.step_simulation(initial=True)

    def step_simulation(self, initial: bool = False):
        self.tick += 1
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Map zone metrics
        zone_asset_counts = {z["id"]: {"total": 0, "healthy": 0, "warning": 0, "critical": 0, "oee_sum": 0.0, "power": 0.0} for z in ZONES_CONFIG}

        for cfg in ASSETS_CONFIG:
            aid = cfg["id"]
            zid = cfg["zone_id"]

            # Physical degradation model over time
            # cmp-01 and cnc-01 have intentional degradation progression
            cycle_phase = (self.tick * cfg["degradation_rate"]) % 100.0
            degradation = cycle_phase * 0.02
            
            # Check injected scenario
            injected = state_store.injected_scenarios.get(aid, {})
            vibe_inj = injected.get("vibration_spike", 0.0)
            temp_inj = injected.get("temp_spike", 0.0)
            load_inj = injected.get("load_mod", 0.0)

            # Realistic physics & harmonic sensor oscillations
            harmonic_1 = math.sin(self.tick * 0.15)
            harmonic_2 = math.cos(self.tick * 0.08)
            noise = random.uniform(-0.05, 0.05)

            # Calculate live sensor readings
            load_pct = max(20.0, min(100.0, 78.0 + load_inj + 12.0 * harmonic_1 + random.uniform(-2, 2)))
            rpm = cfg["nominal_rpm"] * (1.0 + random.uniform(-0.008, 0.008))
            power_kw = (cfg["nominal_power_kw"] * (load_pct / 100.0)) + random.uniform(-1.5, 1.5)

            vibration_x = max(0.1, cfg["base_vibe"] + (degradation * 1.6) + vibe_inj + 0.15 * harmonic_1 + noise)
            vibration_y = max(0.1, vibration_x * 0.85 + random.uniform(-0.08, 0.08))
            vibration_z = max(0.1, vibration_x * 0.70 + random.uniform(-0.06, 0.06))
            vibration_peak = vibration_x * (1.8 + random.uniform(0.1, 0.4))
            vibration_crest_factor = vibration_peak / max(0.01, vibration_x)

            temp_motor = max(25.0, cfg["base_temp"] + (degradation * 18.0) + temp_inj + (load_pct - 75.0) * 0.25 + random.uniform(-0.8, 0.8))
            temp_bearing = temp_motor + 4.5 + (degradation * 8.0) + random.uniform(-0.5, 0.5)
            temp_ambient = 22.5 + 2.0 * math.sin(self.tick * 0.02) + random.uniform(-0.2, 0.2)

            motor_current = (cfg["base_current"] * (load_pct / 100.0)) + (degradation * 12.0) + random.uniform(-1.5, 1.5)
            phase_imbalance = max(0.2, 0.6 + (degradation * 2.2) + random.uniform(-0.1, 0.1))
            acoustic_db = max(20.0, cfg["base_acoustic"] + (degradation * 22.0) + vibe_inj * 8.0 + random.uniform(-1.0, 1.0))
            
            pressure_bar = max(0.0, cfg["base_pressure"] - (degradation * 0.8) + random.uniform(-0.15, 0.15))
            pressure_diff = max(0.05, 0.25 + (degradation * 0.6) + random.uniform(-0.02, 0.02))
            flow_lpm = max(5.0, 45.0 - (degradation * 8.0) + random.uniform(-0.8, 0.8))
            
            oil_particles = int(max(80, 240 + int(degradation * 1400) + random.randint(-20, 20)))
            oil_iso = "16/14/11" if oil_particles < 400 else "19/17/14" if oil_particles < 900 else "22/19/16"
            tank_level = max(15.0, min(100.0, 84.0 - (self.tick * 0.02) % 40.0 + random.uniform(-0.5, 0.5)))
            air_quality_voc = max(0.02, 0.12 + random.uniform(-0.02, 0.02))

            # Run AI Engine on this asset
            prediction = ai_engine.predict_asset(
                asset_id=aid,
                category=cfg["category"],
                vibration_rms=vibration_x,
                temp_motor=temp_motor,
                temp_bearing=temp_bearing,
                motor_current=motor_current,
                pressure=pressure_bar,
                acoustic_db=acoustic_db,
                oil_particles=oil_particles,
                flow_lpm=flow_lpm,
                nominal_rul=cfg["nominal_rul"],
                degradation_factor=degradation + (vibe_inj / 3.0) + (temp_inj / 30.0)
            )

            # Build Component-level Digital Twin states
            components_state = []
            for comp in cfg["components"]:
                cid = comp["id"]
                ctype = comp["component_type"]
                
                # Derive component-specific metrics
                if ctype in ["bearing", "spindle"]:
                    c_vibe = vibration_x * 1.15
                    c_temp = temp_bearing
                    c_health = max(10.0, prediction.health_index - (vibe_inj * 12.0))
                    defect = prediction.failure_mode if prediction.health_state != "Healthy" else None
                    hotspot = prediction.health_state != "Healthy" and vibration_x > 2.2
                elif ctype == "motor":
                    c_vibe = vibration_y
                    c_temp = temp_motor
                    c_health = max(15.0, prediction.health_index + 4.0)
                    defect = "Stator Overheat" if temp_motor > 85.0 else None
                    hotspot = temp_motor > 85.0
                elif ctype == "impeller":
                    c_vibe = vibration_z
                    c_temp = temp_motor - 8.0
                    c_health = max(20.0, prediction.health_index + 2.0)
                    defect = "Cavitation Wear" if acoustic_db > 60.0 else None
                    hotspot = acoustic_db > 60.0
                elif ctype == "valve":
                    c_vibe = vibration_x * 0.4
                    c_temp = temp_ambient + 12.0
                    c_health = max(25.0, 95.0 - (pressure_diff * 40.0))
                    defect = "Pneumatic Micro-Leak" if pressure_diff > 0.6 else None
                    hotspot = pressure_diff > 0.6
                else:
                    c_vibe = vibration_x * 0.8
                    c_temp = temp_motor - 5.0
                    c_health = prediction.health_index
                    defect = None
                    hotspot = False

                comp_status = "Healthy" if c_health > 75.0 else "Warning" if c_health > 45.0 else "Critical"

                components_state.append(ComponentTwinState(
                    id=cid,
                    name=comp["name"],
                    component_type=ctype,
                    health_score=round(c_health, 1),
                    status=comp_status,
                    temperature=round(c_temp, 1),
                    vibration_rms=round(c_vibe, 2),
                    failure_risk=round((100.0 - c_health) / 100.0, 2),
                    defect_type=defect,
                    hotspot=hotspot
                ))

            # Operational status
            if prediction.health_state == "Critical":
                op_status = "Critical"
            elif prediction.health_state == "Warning":
                op_status = "Degraded"
            else:
                op_status = "Operational"

            # Compute asset OEE
            avail = max(70.0, min(100.0, 96.5 - (0.0 if op_status == "Operational" else 8.0 if op_status == "Degraded" else 22.0) + random.uniform(-0.5, 0.5)))
            perf = max(75.0, min(100.0, (load_pct / 85.0) * 98.0 + random.uniform(-1.0, 1.0)))
            qual = max(85.0, min(100.0, 99.2 - (0.0 if op_status == "Operational" else 1.5 if op_status == "Degraded" else 6.0) + random.uniform(-0.3, 0.3)))
            oee = round((avail * perf * qual) / 10000.0, 1)

            asset_tel = AssetTelemetry(
                id=aid,
                name=cfg["name"],
                zone_id=zid,
                zone_name=next(z["name"] for z in ZONES_CONFIG if z["id"] == zid),
                category=cfg["category"],
                status=op_status,
                health_state=prediction.health_state,
                operational_hours=round(4820.0 + self.tick * 0.1, 1),
                oee=oee,
                availability=round(avail, 1),
                performance=round(perf, 1),
                quality=round(qual, 1),
                load_pct=round(load_pct, 1),
                rpm=round(rpm, 1),
                power_kw=round(power_kw, 1),
                vibration_x=round(vibration_x, 2),
                vibration_y=round(vibration_y, 2),
                vibration_z=round(vibration_z, 2),
                vibration_peak=round(vibration_peak, 2),
                vibration_crest_factor=round(vibration_crest_factor, 2),
                temperature_motor=round(temp_motor, 1),
                temperature_bearing=round(temp_bearing, 1),
                temperature_ambient=round(temp_ambient, 1),
                motor_current_a=round(motor_current, 1),
                phase_imbalance_pct=round(phase_imbalance, 2),
                acoustic_emission_db=round(acoustic_db, 1),
                pressure_bar=round(pressure_bar, 2),
                pressure_diff_bar=round(pressure_diff, 2),
                flow_rate_lpm=round(flow_lpm, 1),
                oil_iso_code=oil_iso,
                oil_particles_count=oil_particles,
                tank_level_pct=round(tank_level, 1),
                air_quality_voc_ppm=round(air_quality_voc, 3),
                prediction=prediction,
                components=components_state,
                last_updated=now_str
            )

            state_store.add_or_update_asset(asset_tel)

            # Update zone metrics counters
            zc = zone_asset_counts[zid]
            zc["total"] += 1
            if prediction.health_state == "Healthy":
                zc["healthy"] += 1
            elif prediction.health_state == "Warning":
                zc["warning"] += 1
            else:
                zc["critical"] += 1
            zc["oee_sum"] += oee
            zc["power"] += power_kw

            # Trigger real-time alert and AI prescription if in Warning/Critical state
            if prediction.health_state in ["Warning", "Critical"]:
                sev = "CRITICAL" if prediction.health_state == "Critical" else "WARNING"
                alert_id = f"ALT-{aid}-{self.tick}"
                
                # Check what triggered it
                if vibration_x > 2.0:
                    trig_sensor = "Triaxial Vibration Accelerometer (X-Axis)"
                    trig_val = f"{vibration_x:.2f} mm/s"
                    thresh_val = "2.80 mm/s (Warn) / 4.50 mm/s (Crit)"
                elif temp_bearing > 80.0:
                    trig_sensor = "Bearing RTD Temperature"
                    trig_val = f"{temp_bearing:.1f} °C"
                    thresh_val = "75.0 °C (Warn) / 90.0 °C (Crit)"
                else:
                    trig_sensor = "Ultrasound Acoustic Transducer"
                    trig_val = f"{acoustic_db:.1f} dB"
                    thresh_val = "50.0 dB (Warn) / 70.0 dB (Crit)"

                alert = AlertItem(
                    id=alert_id,
                    asset_id=aid,
                    asset_name=cfg["name"],
                    zone_id=zid,
                    zone_name=asset_tel.zone_name,
                    timestamp=now_str,
                    severity=sev,
                    title=f"{aid.upper()} {prediction.failure_mode} Predicted",
                    description=f"AI anomaly confidence {prediction.failure_mode_probability:.0f}%. RUL countdown estimated at {prediction.rul_cycles} cycles ({prediction.rul_hours}h). Lead time window: {prediction.lead_time_hours}h.",
                    failure_mode=prediction.failure_mode,
                    sensor_trigger=trig_sensor,
                    trigger_value=trig_val,
                    threshold_value=thresh_val,
                    lead_time_hours=prediction.lead_time_hours,
                    estimated_cost_usd=prediction.downtime_cost_risk_usd,
                    acknowledged=False
                )
                state_store.add_alert(alert)

                # Queue AI Prescription
                prescription = AIPrescriptionItem(
                    id=f"RX-{aid}-{self.tick}",
                    asset_id=aid,
                    asset_name=cfg["name"],
                    zone_id=zid,
                    predicted_failure_mode=prediction.failure_mode,
                    confidence=prediction.failure_mode_probability,
                    lead_time_hours=prediction.lead_time_hours,
                    recommended_action=prediction.prescriptive_action,
                    urgency="Immediate" if sev == "CRITICAL" else "Within 24h",
                    estimated_downtime_avoidance_usd=prediction.downtime_cost_risk_usd,
                    feedback_status="Pending Review"
                )
                state_store.add_ai_prescription(prescription)

        # Build Zone Summaries
        for zcfg in ZONES_CONFIG:
            zid = zcfg["id"]
            zc = zone_asset_counts[zid]
            total = max(1, zc["total"])
            zone_oee = round(zc["oee_sum"] / total, 1)
            zone_health = round((zc["healthy"] * 100.0 + zc["warning"] * 55.0 + zc["critical"] * 15.0) / total, 1)
            zone_status = "Critical" if zc["critical"] > 0 else "Warning" if zc["warning"] > 0 else "Healthy"
            
            # Active alarms in this zone
            active_alarms = sum(1 for a in state_store.alerts if a.zone_id == zid and not a.acknowledged)
            
            state_store.zones[zid] = ZoneSummary(
                id=zid,
                name=zcfg["name"],
                description=zcfg["description"],
                supervisor=zcfg["supervisor"],
                total_assets=zc["total"],
                healthy_assets=zc["healthy"],
                warning_assets=zc["warning"],
                critical_assets=zc["critical"],
                health_score=zone_health,
                oee=zone_oee,
                availability=round(min(100.0, zone_oee / 0.92), 1),
                performance=round(min(100.0, zone_oee / 0.94), 1),
                quality=round(min(100.0, zone_oee / 0.96), 1),
                active_alarms_count=active_alarms,
                downtime_hrs_24h=round(zc["warning"] * 0.4 + zc["critical"] * 1.8, 1),
                downtime_cost_24h_usd=round(zc["warning"] * 4200.0 + zc["critical"] * 24500.0, 2),
                power_consumption_kwh=round(zc["power"] * 0.85, 1),
                status=zone_status,
                schematic_type=zcfg["schematic_type"]
            )

    def get_factory_overview(self) -> FactoryOverview:
        assets = list(state_store.assets.values())
        zones = list(state_store.zones.values())

        if not assets:
            self.step_simulation()
            assets = list(state_store.assets.values())
            zones = list(state_store.zones.values())

        tot_assets = len(assets)
        healthy = sum(1 for a in assets if a.health_state == "Healthy")
        warning = sum(1 for a in assets if a.health_state == "Warning")
        critical = sum(1 for a in assets if a.health_state == "Critical")

        avg_oee = round(sum(a.oee for a in assets) / max(1, tot_assets), 1)
        avg_avail = round(sum(a.availability for a in assets) / max(1, tot_assets), 1)
        avg_perf = round(sum(a.performance for a in assets) / max(1, tot_assets), 1)
        avg_qual = round(sum(a.quality for a in assets) / max(1, tot_assets), 1)
        tot_power_mw = round(sum(a.power_kw for a in assets) / 1000.0, 2)

        active_alerts = [a for a in state_store.alerts if not a.acknowledged]
        crit_alerts = sum(1 for a in active_alerts if a.severity == "CRITICAL")
        warn_alerts = sum(1 for a in active_alerts if a.severity == "WARNING")

        # Top risk assets ranked by Urgency x Cost Risk
        risk_ranked = sorted(
            assets,
            key=lambda a: (100.0 - a.prediction.health_index) * (a.prediction.downtime_cost_risk_usd / 1000.0),
            reverse=True
        )
        top_risk_assets = [
            {
                "id": a.id,
                "name": a.name,
                "zone_id": a.zone_id,
                "zone_name": a.zone_name,
                "health_state": a.health_state,
                "health_index": a.prediction.health_index,
                "rul_cycles": a.prediction.rul_cycles,
                "rul_hours": a.prediction.rul_hours,
                "failure_mode": a.prediction.failure_mode,
                "risk_score": round((100.0 - a.prediction.health_index) * 1.2, 1),
                "cost_exposure_usd": a.prediction.downtime_cost_risk_usd,
                "lead_time_hours": a.prediction.lead_time_hours
            }
            for a in risk_ranked[:6]
        ]

        # Collective Sensor Health Stats
        sensor_health = {
            "vibration_sensors": {"online": 48, "warning": warning * 2, "critical": critical * 2, "health_pct": 94.2},
            "thermal_rtd_sensors": {"online": 64, "warning": warning, "critical": critical, "health_pct": 96.8},
            "motor_current_mcsa": {"online": 32, "warning": warning, "critical": critical, "health_pct": 98.1},
            "ultrasonic_acoustic": {"online": 24, "warning": warning, "critical": critical, "health_pct": 92.5},
            "pressure_hydraulic_pneumatic": {"online": 36, "warning": 1, "critical": 0, "health_pct": 97.4},
            "oil_particle_dielectric": {"online": 16, "warning": warning, "critical": 0, "health_pct": 93.8}
        }

        cost_avoided = sum(
            wo.estimated_cost_usd * 4.2 for wo in state_store.work_orders if wo.status in ["In Progress", "Completed"]
        ) + 142500.0

        plant_status = "Critical Attention" if critical > 0 else "Partial Derated" if warning > 1 else "Operational"

        return FactoryOverview(
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            factory_name=state_store.settings["factory_name"],
            plant_status=plant_status,
            overall_oee=avg_oee,
            overall_availability=avg_avail,
            overall_performance=avg_perf,
            overall_quality=avg_qual,
            active_alerts_total=len(active_alerts),
            critical_alerts_count=crit_alerts,
            warning_alerts_count=warn_alerts,
            critical_assets_count=critical,
            predicted_failures_7d=warning + critical,
            predicted_failures_30d=warning * 2 + critical * 2 + 1,
            estimated_downtime_cost_avoided_usd=round(cost_avoided, 2),
            total_power_active_mw=tot_power_mw,
            total_iot_sensors_online=220,
            ai_monitoring_status=f"Active – Continuous Quantile Inference on {tot_assets} Assets & 220 Sensors",
            top_risk_assets=top_risk_assets,
            zone_summaries=zones,
            collective_sensor_health=sensor_health
        )

factory_simulator = FactorySimulator()

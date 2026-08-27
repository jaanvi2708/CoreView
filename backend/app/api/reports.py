from fastapi import APIRouter
from typing import Dict, Any, List
from datetime import datetime
from app.services.state_store import state_store
from app.simulation.factory_simulator import factory_simulator

router = APIRouter()

@router.get("/analytics")
def get_reports_analytics(timeframe: str = "30d"):
    """
    Returns comprehensive analytics data for Downtime Pareto, MTBF/MTTR, OEE trends, and sensor reliability.
    """
    if not state_store.assets:
        factory_simulator.step_simulation()

    # OEE 30-Day Historical Trend
    oee_trend = []
    days = 30 if timeframe == "30d" else 7 if timeframe == "7d" else 90
    for d in range(days, 0, -1):
        day_date = f"2026-08-{(27 - d % 27):02d}"
        oee_trend.append({
            "date": day_date,
            "overall_oee": round(87.5 + ((d * 7) % 9) * 0.8 - 3.0, 1),
            "availability": round(92.0 + ((d * 3) % 7) * 0.6 - 2.0, 1),
            "performance": round(94.5 + ((d * 5) % 6) * 0.5 - 1.5, 1),
            "quality": round(98.2 + ((d * 2) % 4) * 0.2 - 0.5, 1),
            "downtime_hours": round(max(0.5, 4.2 - ((d * 4) % 6) * 0.5), 1)
        })

    # Downtime Pareto Analysis by Failure Mode
    downtime_pareto = [
        {"root_cause": "Bearing Outer Race Fatigue & Spall", "downtime_hours": 38.5, "cost_usd": 77000.0, "events_count": 14, "cumulative_pct": 36.2},
        {"root_cause": "Mechanical Seal & Hydraulic Leakage", "downtime_hours": 26.2, "cost_usd": 52400.0, "events_count": 9, "cumulative_pct": 60.8},
        {"root_cause": "Motor Stator Insulation Thermal Drift", "downtime_hours": 18.0, "cost_usd": 36000.0, "events_count": 6, "cumulative_pct": 77.7},
        {"root_cause": "Pneumatic Solenoid Valve Sticking", "downtime_hours": 12.5, "cost_usd": 25000.0, "events_count": 11, "cumulative_pct": 89.5},
        {"root_cause": "Spindle Drawbar Clamping Force Loss", "downtime_hours": 6.8, "cost_usd": 13600.0, "events_count": 4, "cumulative_pct": 95.9},
        {"root_cause": "Sensor Calibration & Telemetry Glitches", "downtime_hours": 4.4, "cost_usd": 8800.0, "events_count": 8, "cumulative_pct": 100.0}
    ]

    # MTBF (Mean Time Between Failures) and MTTR (Mean Time to Repair)
    reliability_metrics = [
        {"zone": "Utilities & Power", "mtbf_hours": 740, "mttr_hours": 2.8, "availability_pct": 99.1, "criticality": "Tier 1"},
        {"zone": "Production & Machining", "mtbf_hours": 320, "mttr_hours": 3.4, "availability_pct": 91.5, "criticality": "Tier 1"},
        {"zone": "Packaging & Bottling", "mtbf_hours": 480, "mttr_hours": 1.9, "availability_pct": 94.8, "criticality": "Tier 2"},
        {"zone": "Warehouse & Logistics", "mtbf_hours": 610, "mttr_hours": 2.2, "availability_pct": 96.4, "criticality": "Tier 2"},
        {"zone": "Quality Assurance", "mtbf_hours": 890, "mttr_hours": 1.4, "availability_pct": 99.4, "criticality": "Tier 3"}
    ]

    # Financial Cost Savings ROI
    cost_metrics = {
        "unplanned_downtime_avoided_usd": 384500.0,
        "catastrophic_secondary_damage_prevented_usd": 142000.0,
        "optimized_spare_parts_inventory_usd": 56000.0,
        "extended_asset_useful_life_roi_usd": 92000.0,
        "total_financial_impact_usd": 674500.0
    }

    return {
        "timeframe": timeframe,
        "oee_trend": oee_trend,
        "downtime_pareto": downtime_pareto,
        "reliability_metrics": reliability_metrics,
        "cost_metrics": cost_metrics
    }

@router.post("/export")
def export_report_dataset(payload: Dict[str, Any]):
    report_type = payload.get("report_type", "OEE_DOWNTIME_ANALYSIS")
    format_type = payload.get("format", "PDF")
    zone_id = payload.get("zone_id", "all")
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    filename = f"FactoryGuard_Report_{report_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{format_type.lower()}"

    return {
        "status": "ready",
        "download_url": f"/mock-downloads/{filename}",
        "filename": filename,
        "format": format_type,
        "generated_at": timestamp,
        "total_records": 1584,
        "file_size_kb": 248.5
    }

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.services.state_store import state_store
from app.services.ai_engine import ai_engine
from app.simulation.factory_simulator import factory_simulator, ZONES_CONFIG
from app.models.schemas import WhatIfSimulationRequest, WhatIfSimulationResponse

router = APIRouter()

@router.get("/hierarchy")
def get_digital_twin_hierarchy():
    """
    Returns complete Factory -> Zone -> Machine -> Component hierarchy for Digital Twin Explorer.
    """
    if not state_store.assets:
        factory_simulator.step_simulation()

    hierarchy = {
        "factory_id": "apex-smart-plant-04",
        "factory_name": state_store.settings["factory_name"],
        "zones": []
    }

    for zone in ZONES_CONFIG:
        zid = zone["id"]
        z_summary = state_store.zones.get(zid)
        z_assets = [a for a in state_store.assets.values() if a.zone_id == zid]

        zone_node = {
            "id": zid,
            "name": zone["name"],
            "schematic_type": zone["schematic_type"],
            "health_score": z_summary.health_score if z_summary else 95.0,
            "status": z_summary.status if z_summary else "Healthy",
            "assets": [
                {
                    "id": a.id,
                    "name": a.name,
                    "category": a.category,
                    "health_state": a.health_state,
                    "health_index": a.prediction.health_index,
                    "rul_cycles": a.prediction.rul_cycles,
                    "components_count": len(a.components),
                    "components": a.components
                }
                for a in z_assets
            ]
        }
        hierarchy["zones"].append(zone_node)

    return hierarchy

@router.post("/simulate", response_model=WhatIfSimulationResponse)
def simulate_what_if(payload: WhatIfSimulationRequest):
    asset = state_store.assets.get(payload.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{payload.asset_id}' not found")
    
    response = ai_engine.simulate_what_if(
        asset_id=payload.asset_id,
        current_rul=asset.prediction.rul_cycles,
        current_health=asset.prediction.health_index,
        load_delta=payload.load_pct_delta,
        rpm_delta=payload.rpm_delta,
        temp_delta=payload.ambient_temp_delta,
        lube_quality=payload.lubrication_quality_pct
    )
    return response

@router.get("/{asset_id}/comparison")
def get_twin_comparison(asset_id: str):
    """
    Returns side-by-side state comparison: Nominal Baseline vs Current Live vs Projected Degraded
    """
    asset = state_store.assets.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")

    return {
        "asset_id": asset.id,
        "name": asset.name,
        "category": asset.category,
        "baseline_state": {
            "health_index": 100.0,
            "rul_cycles": 350,
            "vibration_rms": 0.45,
            "bearing_temp_c": 50.0,
            "motor_current_a": 80.0,
            "acoustic_emission_db": 32.0,
            "failure_mode": "None (Nominal OEM Baseline)",
            "defect_heatspots": []
        },
        "current_state": {
            "health_index": asset.prediction.health_index,
            "rul_cycles": asset.prediction.rul_cycles,
            "vibration_rms": asset.vibration_x,
            "bearing_temp_c": asset.temperature_bearing,
            "motor_current_a": asset.motor_current_a,
            "acoustic_emission_db": asset.acoustic_emission_db,
            "failure_mode": asset.prediction.failure_mode if asset.health_state != "Healthy" else "None",
            "defect_heatspots": [c.name for c in asset.components if c.hotspot]
        },
        "projected_degraded_state_30d": {
            "health_index": max(0.0, asset.prediction.health_index - 35.0),
            "rul_cycles": max(0, asset.prediction.rul_cycles - 45),
            "vibration_rms": round(asset.vibration_x * 1.6, 2),
            "bearing_temp_c": round(asset.temperature_bearing + 18.0, 1),
            "motor_current_a": round(asset.motor_current_a * 1.25, 1),
            "acoustic_emission_db": round(asset.acoustic_emission_db + 15.0, 1),
            "failure_mode": asset.prediction.failure_mode,
            "critical_rupture_risk_pct": 82.5
        }
    }

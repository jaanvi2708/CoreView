from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.services.state_store import state_store
from app.simulation.factory_simulator import factory_simulator
from app.models.schemas import AssetTelemetry

router = APIRouter()

@router.get("/", response_model=List[AssetTelemetry])
def get_all_assets(zone_id: Optional[str] = None, health_state: Optional[str] = None):
    if not state_store.assets:
        factory_simulator.step_simulation()
    
    assets = list(state_store.assets.values())
    if zone_id:
        assets = [a for a in assets if a.zone_id == zone_id]
    if health_state:
        assets = [a for a in assets if a.health_state.lower() == health_state.lower()]
    return assets

@router.get("/{asset_id}", response_model=AssetTelemetry)
def get_asset_by_id(asset_id: str):
    if not state_store.assets:
        factory_simulator.step_simulation()
    
    asset = state_store.assets.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    return asset

@router.get("/{asset_id}/history")
def get_asset_history(asset_id: str):
    asset = state_store.assets.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    
    history = state_store.asset_history.get(asset_id, [])
    
    # Generate degradation curve historical and projected
    degradation_curve = []
    current_health = asset.prediction.health_index
    current_rul = asset.prediction.rul_cycles
    
    # Historical 30 cycles
    for c in range(-30, 1, 5):
        past_h = min(100.0, current_health + abs(c) * (100.0 - current_health) / 40.0)
        degradation_curve.append({
            "cycle": c,
            "phase": "historical",
            "health_index": round(past_h, 1),
            "ci_lower": round(past_h * 0.96, 1),
            "ci_upper": min(100.0, round(past_h * 1.04, 1))
        })

    # Projected future cycles
    for c in range(5, current_rul + 15, 5):
        future_h = max(0.0, current_health - (current_health / max(1, current_rul)) * c)
        ci_spread = min(20.0, c * 0.25)
        degradation_curve.append({
            "cycle": c,
            "phase": "projected",
            "health_index": round(future_h, 1),
            "ci_lower": max(0.0, round(future_h - ci_spread, 1)),
            "ci_upper": min(100.0, round(future_h + ci_spread, 1))
        })

    return {
        "asset_id": asset_id,
        "recent_telemetry_points": history,
        "degradation_curve": degradation_curve,
        "sensor_thresholds": {
            "vibration_rms": {"warn": 2.8, "crit": 4.5, "unit": "mm/s"},
            "bearing_temp": {"warn": 75.0, "crit": 90.0, "unit": "°C"},
            "motor_current": {"warn": 140.0, "crit": 165.0, "unit": "A"},
            "acoustic_emission": {"warn": 55.0, "crit": 75.0, "unit": "dB"}
        }
    }

@router.get("/{asset_id}/twin")
def get_asset_twin_state(asset_id: str):
    asset = state_store.assets.get(asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
    
    return {
        "asset_id": asset.id,
        "name": asset.name,
        "category": asset.category,
        "zone_id": asset.zone_id,
        "health_state": asset.health_state,
        "overall_health_score": asset.prediction.health_index,
        "components": asset.components,
        "live_telemetry": {
            "vibration_x": asset.vibration_x,
            "vibration_y": asset.vibration_y,
            "vibration_z": asset.vibration_z,
            "temperature_motor": asset.temperature_motor,
            "temperature_bearing": asset.temperature_bearing,
            "motor_current_a": asset.motor_current_a,
            "pressure_bar": asset.pressure_bar,
            "acoustic_emission_db": asset.acoustic_emission_db,
            "flow_rate_lpm": asset.flow_rate_lpm,
            "rpm": asset.rpm,
            "load_pct": asset.load_pct
        },
        "active_fault": asset.prediction.failure_mode if asset.health_state != "Healthy" else None
    }

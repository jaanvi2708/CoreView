from fastapi import APIRouter
from typing import Dict, Any, List
from app.services.state_store import state_store
from app.simulation.factory_simulator import ZONES_CONFIG, ASSETS_CONFIG

router = APIRouter()

@router.get("/")
def get_settings():
    return state_store.settings

@router.post("/")
def update_settings(payload: Dict[str, Any]):
    for k, v in payload.items():
        state_store.settings[k] = v
    return {"message": "Settings updated successfully", "settings": state_store.settings}

@router.get("/hierarchy")
def get_asset_hierarchy():
    hierarchy = []
    for z in ZONES_CONFIG:
        zid = z["id"]
        assets = [
            {
                "id": a["id"],
                "name": a["name"],
                "category": a["category"],
                "nominal_rpm": a["nominal_rpm"],
                "nominal_power_kw": a["nominal_power_kw"],
                "components": a["components"],
                "sensors": [
                    {"type": "Triaxial Vibration", "channels": ["X", "Y", "Z"], "unit": "mm/s"},
                    {"type": "Temperature RTD", "channels": ["Motor", "Bearing", "Ambient"], "unit": "°C"},
                    {"type": "Current MCSA", "channels": ["Phase A", "Phase B", "Phase C"], "unit": "A"},
                    {"type": "Acoustic Ultrasound", "channels": ["Transducer 1"], "unit": "dB"},
                    {"type": "Pressure Transducer", "channels": ["Main", "Differential"], "unit": "bar"}
                ]
            }
            for a in ASSETS_CONFIG if a["zone_id"] == zid
        ]
        hierarchy.append({
            "zone_id": zid,
            "zone_name": z["name"],
            "supervisor": z["supervisor"],
            "assets": assets
        })
    return hierarchy

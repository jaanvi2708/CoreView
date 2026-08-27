from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.state_store import state_store
from app.simulation.factory_simulator import factory_simulator, ZONES_CONFIG
from app.models.schemas import ZoneSummary, AssetTelemetry

router = APIRouter()

@router.get("/", response_model=List[ZoneSummary])
def get_all_zones():
    if not state_store.zones:
        factory_simulator.step_simulation()
    return list(state_store.zones.values())

@router.get("/{zone_id}", response_model=ZoneSummary)
def get_zone_by_id(zone_id: str):
    if not state_store.zones:
        factory_simulator.step_simulation()
    
    zone = state_store.zones.get(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    return zone

@router.get("/{zone_id}/assets", response_model=List[AssetTelemetry])
def get_zone_assets(zone_id: str):
    if not state_store.assets:
        factory_simulator.step_simulation()
    
    assets = [a for a in state_store.assets.values() if a.zone_id == zone_id]
    return assets

@router.get("/{zone_id}/analytics")
def get_zone_analytics(zone_id: str):
    zone = state_store.zones.get(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
    
    assets = [a for a in state_store.assets.values() if a.zone_id == zone_id]
    
    # Generate realistic hourly trend for this zone (last 24 hours)
    hourly_trends = []
    base_oee = zone.oee
    for h in range(24):
        hourly_trends.append({
            "hour": f"{h:02d}:00",
            "oee": round(max(60.0, min(99.5, base_oee + (h % 5 - 2) * 1.5)), 1),
            "availability": round(max(70.0, min(100.0, zone.availability + (h % 3 - 1) * 1.2)), 1),
            "performance": round(max(70.0, min(100.0, zone.performance + (h % 4 - 2) * 1.0)), 1),
            "quality": round(max(85.0, min(100.0, zone.quality + (h % 2) * 0.4)), 1),
            "power_kw": round(zone.power_consumption_kwh * (0.85 + (h % 6) * 0.04), 1)
        })

    # Prescriptive recommendations for this zone
    zone_rx = [rx for rx in state_store.ai_prescriptions if rx.zone_id == zone_id]

    return {
        "zone": zone,
        "assets_count": len(assets),
        "hourly_trends": hourly_trends,
        "prescriptions": zone_rx,
        "downtime_pareto": [
            {"category": "Unplanned Bearing Overheating", "hours": round(zone.downtime_hrs_24h * 0.45, 1), "pct": 45},
            {"category": "Pneumatic / Hydraulic Seal Leak", "hours": round(zone.downtime_hrs_24h * 0.30, 1), "pct": 30},
            {"category": "Sensor Recalibration & Drift", "hours": round(zone.downtime_hrs_24h * 0.15, 1), "pct": 15},
            {"category": "Changeover & Tool Wear", "hours": round(zone.downtime_hrs_24h * 0.10, 1), "pct": 10}
        ]
    }

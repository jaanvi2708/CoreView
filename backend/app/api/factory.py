from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.simulation.factory_simulator import factory_simulator
from app.services.state_store import state_store
from app.models.schemas import FactoryOverview

router = APIRouter()

@router.get("/overview", response_model=FactoryOverview)
def get_factory_overview():
    return factory_simulator.get_factory_overview()

@router.post("/scenarios/inject")
def inject_scenario(payload: Dict[str, Any]):
    """
    Injects physical faults for interactive demonstration:
    payload example: {"asset_id": "cmp-01", "fault_type": "vibration_spike", "magnitude": 2.5}
    """
    aid = payload.get("asset_id", "cmp-01")
    fault_type = payload.get("fault_type", "vibration_spike")
    magnitude = payload.get("magnitude", 2.0)

    if aid not in state_store.injected_scenarios:
        state_store.injected_scenarios[aid] = {}

    if fault_type == "vibration_spike":
        state_store.injected_scenarios[aid]["vibration_spike"] = magnitude
    elif fault_type == "temp_spike":
        state_store.injected_scenarios[aid]["temp_spike"] = magnitude
    elif fault_type == "load_mod":
        state_store.injected_scenarios[aid]["load_mod"] = magnitude

    factory_simulator.step_simulation()
    return {"message": f"Injected {fault_type} of magnitude {magnitude} on asset {aid}", "status": "active"}

@router.post("/scenarios/reset")
def reset_scenarios():
    state_store.injected_scenarios.clear()
    factory_simulator.step_simulation()
    return {"message": "All injected fault scenarios cleared", "status": "nominal"}

@router.post("/actions/acknowledge-all")
def acknowledge_all_alerts():
    for alert in state_store.alerts:
        alert.acknowledged = True
        alert.acknowledged_by = state_store.settings["active_role"]
    return {"message": "All active alerts acknowledged", "count": len(state_store.alerts)}

@router.post("/actions/emergency-shutdown")
def emergency_shutdown(payload: Dict[str, str]):
    target = payload.get("target", "factory")
    return {"message": f"Emergency derate & safe-stop signal dispatched for {target}", "status": "dispatched"}

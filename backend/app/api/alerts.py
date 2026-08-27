from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.services.state_store import state_store
from app.models.schemas import AlertItem, WorkOrder

router = APIRouter()

@router.get("/", response_model=List[AlertItem])
def get_alerts(zone_id: Optional[str] = None, severity: Optional[str] = None, acknowledged: Optional[bool] = None):
    alerts = state_store.alerts
    if zone_id:
        alerts = [a for a in alerts if a.zone_id == zone_id]
    if severity:
        alerts = [a for a in alerts if a.severity.upper() == severity.upper()]
    if acknowledged is not None:
        alerts = [a for a in alerts if a.acknowledged == acknowledged]
    return alerts

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, payload: Optional[Dict[str, str]] = None):
    role = payload.get("user", state_store.settings["active_role"]) if payload else state_store.settings["active_role"]
    for a in state_store.alerts:
        if a.id == alert_id:
            a.acknowledged = True
            a.acknowledged_by = role
            return {"message": f"Alert {alert_id} acknowledged", "alert": a}
    raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")

@router.post("/{alert_id}/convert-to-work-order", response_model=WorkOrder)
def convert_alert_to_work_order(alert_id: str, payload: Optional[Dict[str, Any]] = None):
    target_alert = None
    for a in state_store.alerts:
        if a.id == alert_id:
            target_alert = a
            break

    if not target_alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")

    # Generate new work order
    wo_count = len(state_store.work_orders) + 8930
    wo_id = f"WO-{wo_count}"
    
    asset = state_store.assets.get(target_alert.asset_id)
    assigned_tech = payload.get("assigned_to", "Dave Miller (Senior Millwright)") if payload else "Dave Miller (Senior Millwright)"
    priority = "P1 - Emergency" if target_alert.severity == "CRITICAL" else "P2 - High"

    wo = WorkOrder(
        id=wo_id,
        title=f"Corrective Intervention: {target_alert.title}",
        asset_id=target_alert.asset_id,
        asset_name=target_alert.asset_name,
        zone_id=target_alert.zone_id,
        zone_name=target_alert.zone_name,
        priority=priority,
        status="Assigned",
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        assigned_to=assigned_tech,
        assigned_technician_role="Level III Reliability Technician",
        scheduled_start=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        estimated_hours=asset.prediction.estimated_wrench_time_hrs if asset else 3.0,
        prescriptive_procedure=asset.prediction.prescriptive_action if asset else "Execute standard maintenance protocol.",
        required_parts=asset.prediction.required_parts if asset else ["OEM Standard Seal Kit"],
        parts_status="Reserved",
        estimated_cost_usd=target_alert.estimated_cost_usd * 0.12, # Repair cost vs downtime risk
        source_alert_id=alert_id,
        notes=[f"Auto-generated from alert {alert_id} ({target_alert.failure_mode})."]
    )

    state_store.add_work_order(wo)
    target_alert.acknowledged = True
    target_alert.work_order_id = wo_id

    return wo

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.services.state_store import state_store
from app.models.schemas import WorkOrder

router = APIRouter()

@router.get("/", response_model=List[WorkOrder])
def get_work_orders(status: Optional[str] = None, zone_id: Optional[str] = None, priority: Optional[str] = None):
    wos = state_store.work_orders
    if status:
        wos = [w for w in wos if w.status.lower() == status.lower()]
    if zone_id:
        wos = [w for w in wos if w.zone_id == zone_id]
    if priority:
        wos = [w for w in wos if w.priority.lower() == priority.lower()]
    return wos

@router.post("/", response_model=WorkOrder)
def create_work_order(payload: Dict[str, Any]):
    wo_count = len(state_store.work_orders) + 8930
    wo_id = f"WO-{wo_count}"
    
    aid = payload.get("asset_id", "cmp-01")
    asset = state_store.assets.get(aid)
    
    wo = WorkOrder(
        id=wo_id,
        title=payload.get("title", f"Maintenance Work Order for {aid}"),
        asset_id=aid,
        asset_name=asset.name if asset else aid,
        zone_id=asset.zone_id if asset else "utilities",
        zone_name=asset.zone_name if asset else "Utilities, Power & Plant HVAC",
        priority=payload.get("priority", "P2 - High"),
        status=payload.get("status", "Open"),
        created_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        assigned_to=payload.get("assigned_to", "Unassigned"),
        assigned_technician_role=payload.get("assigned_technician_role", "Mechanical Maintenance Technician"),
        scheduled_start=payload.get("scheduled_start", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        estimated_hours=float(payload.get("estimated_hours", 3.0)),
        prescriptive_procedure=payload.get("prescriptive_procedure", "Perform standard inspection and repair."),
        required_parts=payload.get("required_parts", ["General Maintenance Kit"]),
        parts_status=payload.get("parts_status", "In Stock"),
        estimated_cost_usd=float(payload.get("estimated_cost_usd", 1250.0)),
        notes=payload.get("notes", ["Created manually from Control Panel."])
    )
    state_store.add_work_order(wo)
    return wo

@router.patch("/{work_order_id}", response_model=WorkOrder)
def update_work_order(work_order_id: str, updates: Dict[str, Any]):
    for wo in state_store.work_orders:
        if wo.id == work_order_id:
            if "status" in updates:
                wo.status = updates["status"]
            if "assigned_to" in updates:
                wo.assigned_to = updates["assigned_to"]
            if "actual_hours" in updates:
                wo.actual_hours = float(updates["actual_hours"])
            if "actual_cost_usd" in updates:
                wo.actual_cost_usd = float(updates["actual_cost_usd"])
            if "notes" in updates:
                if isinstance(updates["notes"], list):
                    wo.notes.extend(updates["notes"])
                else:
                    wo.notes.append(str(updates["notes"]))
            return wo
    raise HTTPException(status_code=404, detail=f"Work Order '{work_order_id}' not found")

@router.get("/technicians/available")
def get_available_technicians():
    return [
        {"id": "MECH-A01", "role": "Mechanical Technician (Vibration Analyst)", "shift": "Shift 2", "status": "Available", "skills": ["Bearings", "Laser Alignment", "Turbomachinery"]},
        {"id": "MACH-B02", "role": "CNC Machine Specialist", "shift": "Shift 2", "status": "On Task (WO-8921)", "skills": ["Spindles", "Hydraulics", "Ball Screws"]},
        {"id": "ELEC-C03", "role": "Electrical & Drives Technician", "shift": "Shift 2", "status": "Available", "skills": ["VFDs", "Stator Winding", "PLC/SCADA"]},
        {"id": "HYDR-D04", "role": "Fluid Power & Hydraulics Technician", "shift": "Shift 2", "status": "Available", "skills": ["Pumps", "Valves", "Flow Meters"]},
        {"id": "AUTO-E05", "role": "Robotics & Automation Specialist", "shift": "Shift 2", "status": "Available", "skills": ["Harmonic Drives", "Vision Systems", "Kinematics"]}
    ]

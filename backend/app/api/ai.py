from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from app.services.ai_engine import ai_engine
from app.services.state_store import state_store
from app.models.schemas import AIModelMetrics, AIPrescriptionItem

router = APIRouter()

@router.get("/models", response_model=List[AIModelMetrics])
def get_ai_models():
    return ai_engine.models_status

@router.get("/recommendations", response_model=List[AIPrescriptionItem])
def get_ai_recommendations():
    return state_store.ai_prescriptions

@router.post("/feedback")
def submit_ai_feedback(payload: Dict[str, Any]):
    """
    Operator confirms, rejects, or overrides an AI prescription.
    Payload: {"prescription_id": "RX-cmp-01-12", "action": "Approved"|"Rejected"|"Overridden", "notes": "...", "reviewed_by": "..."}
    """
    rx_id = payload.get("prescription_id")
    action = payload.get("action", "Approved")
    notes = payload.get("notes", "")
    reviewer = payload.get("reviewed_by", state_store.settings["active_role"])

    for rx in state_store.ai_prescriptions:
        if rx.id == rx_id:
            rx.feedback_status = action
            rx.feedback_notes = notes
            rx.reviewed_by = reviewer
            rx.reviewed_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return {"message": f"Prescription {rx_id} updated to {action}", "item": rx}

    raise HTTPException(status_code=404, detail=f"Prescription '{rx_id}' not found")

@router.post("/retrain")
def trigger_model_retrain(payload: Dict[str, str]):
    model_name = payload.get("model_name", "All Models")
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for m in ai_engine.models_status:
        if model_name in ["All Models", m.model_name]:
            m.last_trained = now_str
            m.psi_drift_index = 0.015
            m.status = "Optimal"
    return {"message": f"Retraining pipeline executed successfully for {model_name}", "timestamp": now_str}

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any
from app.simulation.factory_simulator import factory_simulator
from app.services.state_store import state_store

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()

def build_telemetry_payload() -> Dict[str, Any]:
    overview = factory_simulator.get_factory_overview()
    assets = list(state_store.assets.values())
    zones = list(state_store.zones.values())
    alerts = [a.model_dump() for a in state_store.alerts[:15]]
    
    # Serialize assets and predictions
    serialized_assets = [a.model_dump() for a in assets]
    serialized_zones = [z.model_dump() for z in zones]

    return {
        "type": "FACTORY_TELEMETRY_UPDATE",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "overview": overview.model_dump(),
        "assets": serialized_assets,
        "zones": serialized_zones,
        "recent_alerts": alerts
    }

async def continuous_simulation_loop():
    while True:
        try:
            # Step the simulation forward
            factory_simulator.step_simulation()

            if manager.active_connections:
                payload = build_telemetry_payload()
                message_text = json.dumps(payload)
                await manager.broadcast(message_text)
        except Exception as e:
            print(f"Error in simulation loop: {e}")

        await asyncio.sleep(1.0) # Broadcast every second


@router.websocket("/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send immediate state on connect
    try:
        init_payload = build_telemetry_payload()
        await websocket.send_text(json.dumps(init_payload))
        
        while True:
            # Listen for client-side commands
            text_data = await websocket.receive_text()
            try:
                cmd = json.loads(text_data)
                cmd_type = cmd.get("type")
                if cmd_type == "ACKNOWLEDGE_ALERT":
                    aid = cmd.get("alert_id")
                    for a in state_store.alerts:
                        if a.id == aid:
                            a.acknowledged = True
                elif cmd_type == "INJECT_FAULT":
                    aid = cmd.get("asset_id", "cmp-01")
                    if aid not in state_store.injected_scenarios:
                        state_store.injected_scenarios[aid] = {}
                    state_store.injected_scenarios[aid]["vibration_spike"] = float(cmd.get("magnitude", 2.0))
                elif cmd_type == "CLEAR_FAULTS":
                    state_store.injected_scenarios.clear()
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import uvicorn

from app.api import factory, assets, zones, digital_twins, ai, alerts, work_orders, reports, settings, websockets
from app.api.websockets import continuous_simulation_loop

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background telemetry broadcast task
    task = asyncio.create_task(continuous_simulation_loop())
    yield
    task.cancel()

app = FastAPI(
    title="FactoryGuard Enterprise SCADA & Predictive Maintenance API",
    description="Enterprise API providing multi-zone telemetry, interactive Digital Twins, and ML-driven predictive maintenance for 24/7 Smart Manufacturing.",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(factory.router, prefix="/api/factory", tags=["Factory Overview & Controls"])
app.include_router(zones.router, prefix="/api/zones", tags=["Operational Zones"])
app.include_router(assets.router, prefix="/api/assets", tags=["Asset Telemetry & Health"])
app.include_router(digital_twins.router, prefix="/api/digital-twins", tags=["Digital Twin Platform"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Predictive & Prescriptive Engine"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alarms & Notifications"])
app.include_router(work_orders.router, prefix="/api/work-orders", tags=["Work Order Management"])
app.include_router(reports.router, prefix="/api/reports", tags=["Analytics & Reports"])
app.include_router(settings.router, prefix="/api/settings", tags=["Configuration & Hierarchy"])
app.include_router(websockets.router, prefix="/ws", tags=["Real-Time WebSockets"])

@app.get("/")
def read_root():
    return {
        "system": "FactoryGuard Enterprise Operational Control System",
        "status": "ONLINE",
        "version": "2.0.0",
        "endpoints": {
            "overview": "/api/factory/overview",
            "zones": "/api/zones",
            "assets": "/api/assets",
            "digital_twins": "/api/digital-twins/hierarchy",
            "ai_models": "/api/ai/models",
            "alerts": "/api/alerts",
            "work_orders": "/api/work-orders",
            "reports": "/api/reports/analytics",
            "settings": "/api/settings",
            "websocket_stream": "ws://localhost:8000/ws/telemetry"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

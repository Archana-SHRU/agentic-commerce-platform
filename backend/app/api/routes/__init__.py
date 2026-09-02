"""API route modules, aggregated into a single router for main.py to include."""
from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.products import router as products_router
from app.api.routes.merchants import router as merchants_router
from app.api.routes.orders import router as orders_router
from app.api.routes.audit_logs import router as audit_logs_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(products_router)
api_router.include_router(merchants_router)
api_router.include_router(orders_router)
api_router.include_router(audit_logs_router)

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, verify_database_connection
from app.core.scheduler import (
    bootstrap_scraper_sources,
    run_startup_permission_check,
    shutdown_scheduler,
    start_scheduler,
)
from app.routers.admin import router as admin_router
from app.routers.auth import me_router, router as auth_router
from app.routers.events import router as events_router
from app.routers.listings import router as listings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await verify_database_connection()
    await bootstrap_scraper_sources()
    start_scheduler()
    await run_startup_permission_check()
    yield
    shutdown_scheduler()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(events_router)
app.include_router(listings_router)
app.include_router(admin_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}

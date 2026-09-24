import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
import logging
import webbrowser
import threading
import time
import os
import tempfile
import hashlib
import collections

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# ============================================================
# WINDOWS EVENT LOOP
# ============================================================
if sys.platform == "win32":
    asyncio.set_event_loop_policy(
        asyncio.WindowsProactorEventLoopPolicy()
    )

    # Prevent noisy asyncio socket warnings
    logging.getLogger("asyncio").setLevel(logging.ERROR)


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

if not os.environ.get("GEMINI_API_KEY") or not os.environ.get("OPENROUTER_API_KEY"):
    raise RuntimeError("Missing required API keys: Please ensure GEMINI_API_KEY and OPENROUTER_API_KEY are set in the .env file.")

# ============================================================
# DNS RESOLVER CONFIGURATION (MongoDB Atlas SRV fix)
# ============================================================
try:
    import dns.resolver
    dns.resolver.default_resolver = dns.resolver.Resolver()
    dns.resolver.default_resolver.nameservers = ['8.8.8.8', '8.8.4.4', '1.1.1.1'] + dns.resolver.default_resolver.nameservers
except Exception as e:
    logging.warning(f"Could not configure custom DNS nameservers: {e}")

# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)


# ============================================================
# LOG BUFFER
# ============================================================

class LogBufferHandler(logging.Handler):
    """
    Keeps a bounded in-memory buffer of application logs.

    The WebSocket endpoint reads from this buffer and streams
    new logs to connected frontend clients.
    """

    def __init__(self, max_size=1000):
        super().__init__()

        self.logs = []
        self.max_size = max_size
        self.total_count = 0

    def emit(self, record):
        try:
            msg = self.format(record)

            self.total_count += 1

            self.logs.append(
                (
                    self.total_count,
                    msg
                )
            )

            # Keep buffer bounded
            if len(self.logs) > self.max_size:
                self.logs.pop(0)

        except Exception:
            # Logging must never crash the application
            pass


# Initialize logging buffer
log_buffer_handler = LogBufferHandler(max_size=1000)

log_buffer_handler.setFormatter(
    logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    )
)

logging.getLogger().addHandler(log_buffer_handler)


# ============================================================
# APPLICATION IMPORTS
# ============================================================

from app.core.config import settings

from app.db.mongodb import (
    connect_to_mongo,
    close_mongo_connection
)

from app.modules import router as auth_router
from app.modules import pat_router
from app.modules.workspace import router as workspace_router
from app.modules.agents_router import router as agents_router
from app.modules.runs_router import router as runs_router
from app.modules.projects.router import router as projects_router
from app.modules.integrations.router import router as integrations_router
from app.modules.analytics.router import router as analytics_router
from app.modules.execution.router import router as execution_router
from app.modules.settings.notification_router import router as notification_settings_router
from app.modules.test_generation.router import router as test_generation_router

# Global shutdown event to prevent websocket hanging on reload
shutdown_event = asyncio.Event()


def _ensure_ollama_running():
    """
    Auto-starts Ollama server if not already running.
    """
    import subprocess
    import urllib.request

    try:
        urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=0.2)
        return
    except Exception:
        pass

    try:
        CREATE_NO_WINDOW = 0x08000000
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=CREATE_NO_WINDOW | CREATE_NEW_PROCESS_GROUP,
            close_fds=True
        )
    except Exception:
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    shutdown_event.clear()

    # Auto-start Ollama in background thread without blocking server readiness
    threading.Thread(target=_ensure_ollama_running, daemon=True).start()

    try:
        await asyncio.wait_for(connect_to_mongo(), timeout=5.0)

        from app.db.mongodb import db_client
        from app.core import security
        from app.schemas.user import UserInDB
        from datetime import datetime

        if db_client.db is not None:
            test_user = await asyncio.wait_for(db_client.db.users.find_one({"email": "test@example.com"}), timeout=3.0)
            hashed_password = security.get_password_hash("password123")

            if not test_user:
                logging.info("No default user found in database. Seeding default user...")
                db_user = UserInDB(
                    name="Test User",
                    email="test@example.com",
                    hashed_password=hashed_password,
                    is_active=True,
                    password_last_updated=datetime.utcnow()
                )
                await db_client.db.users.insert_one(db_user.model_dump(by_alias=True, exclude_none=True))
                logging.info("Default user test@example.com seeded successfully.")
            else:
                await db_client.db.users.update_one({"email": "test@example.com"}, {"$set": {"hashed_password": hashed_password}})
    except Exception as e:
        logging.error(f"MongoDB startup/seeding error: {e}")
        
    # Validate integration credentials
    if not settings.SLACK_CLIENT_ID or not settings.SLACK_CLIENT_SECRET:
        logging.warning("Slack integration credentials (SLACK_CLIENT_ID or SLACK_CLIENT_SECRET) are missing. Slack integration will be unavailable.")
        
    if not settings.MS_CLIENT_ID or not settings.MS_CLIENT_SECRET:
        logging.warning("Microsoft Teams integration credentials (MS_CLIENT_ID or MS_CLIENT_SECRET) are missing. Microsoft Teams integration will be unavailable.")
        
    if not settings.ENCRYPTION_KEY:
        logging.warning("ENCRYPTION_KEY is missing. Using fallback. DO NOT USE IN PRODUCTION.")

    # Application is ready
    yield
    # Shutdown
    shutdown_event.set()
    await close_mongo_connection()


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Backend service containing autonomous "
        "agents for AI testing pipelines."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(pat_router.router, prefix=f"{settings.API_V1_STR}/auth/pats", tags=["pats"])
app.include_router(workspace_router.router, prefix=f"{settings.API_V1_STR}/workspaces", tags=["workspaces"])
app.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(integrations_router, prefix=f"{settings.API_V1_STR}/integrations", tags=["integrations"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(execution_router, prefix=f"{settings.API_V1_STR}/execution", tags=["execution"])
app.include_router(notification_settings_router, prefix=f"{settings.API_V1_STR}/settings/notifications", tags=["settings-notifications"])
app.include_router(test_generation_router, prefix=f"{settings.API_V1_STR}/tests", tags=["tests"])
app.include_router(agents_router)
app.include_router(runs_router, prefix=f"{settings.API_V1_STR}")
@app.websocket("/api/logs/ws")
async def websocket_logs(websocket: WebSocket):

    client = websocket.client

    try:
        # ----------------------------------------------------
        # ACCEPT CONNECTION
        # ----------------------------------------------------

        await websocket.accept()

        logging.info(
            f"Log WebSocket connected: {client}"
        )

        # ----------------------------------------------------
        # SEND RECENT LOGS
        # ----------------------------------------------------

        recent_logs = log_buffer_handler.logs[-100:]

        last_id = (
            recent_logs[-1][0]
            if recent_logs
            else 0
        )

        for log_id, log_msg in recent_logs:

            await websocket.send_text(log_msg)

        # ----------------------------------------------------
        # STREAM NEW LOGS
        # ----------------------------------------------------

        while not shutdown_event.is_set():
            current_logs = log_buffer_handler.logs

            new_logs = [
                entry
                for entry in current_logs
                if entry[0] > last_id
            ]

            for log_id, log_msg in new_logs:

                await websocket.send_text(
                    log_msg
                )

                last_id = log_id

            # Don't hammer the event loop
            await asyncio.sleep(0.5)

    # --------------------------------------------------------
    # NORMAL CLIENT DISCONNECT
    # --------------------------------------------------------

    except WebSocketDisconnect:

        logging.info(
            f"Log WebSocket disconnected normally: {client}"
        )

    # --------------------------------------------------------
    # SOCKET CLOSED / RESET
    # --------------------------------------------------------

    except (
        ConnectionResetError,
        BrokenPipeError,
        ConnectionAbortedError
    ):

        logging.info(
            f"Log WebSocket connection closed: {client}"
        )

    # --------------------------------------------------------
    # TASK CANCELLED
    # --------------------------------------------------------

    except asyncio.CancelledError:

        logging.info(
            f"Log WebSocket task cancelled: {client}"
        )

    # --------------------------------------------------------
    # UNEXPECTED ERROR
    # --------------------------------------------------------

    except Exception as e:

        logging.warning(
            f"Log WebSocket error for {client}: {e}"
        )

    # --------------------------------------------------------
    # CLEANUP
    # --------------------------------------------------------

    finally:

        logging.info(
            f"Log WebSocket cleanup completed: {client}"
        )


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def read_root():

    from fastapi.responses import RedirectResponse

    return RedirectResponse(
        url="/docs"
    )
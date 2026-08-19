import logging
import io
from datetime import datetime
import cloudinary
import cloudinary.uploader
from app.tools.browser import browser_manager
from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

async def take_screenshot(name: str = None) -> str:
    """
    Take a full page screenshot directly into a memory buffer,
    upload it to Cloudinary with a guaranteed unique per-run name,
    and return the secure Cloudinary URL.
    Never reuses the same Cloudinary public_id across runs.
    """
    import random
    import string
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    if not name:
        name = f"screenshot_{ts}_{suffix}"
    elif name.endswith(".png"):
        name = name[:-4]
    # Always append unique suffix to prevent cross-run Cloudinary overwrite
    unique_name = f"{name}_{ts}_{suffix}"

    logger.info(f"[Explorer] Taking Screenshot directly to memory")
    
    # 1. Capture screenshot as raw bytes (no path provided)
    async def _screenshot():
        page = await browser_manager.get_page()
        return await page.screenshot(full_page=True)

    screenshot_bytes = await browser_manager.run_async(_screenshot())

    # 2. Upload bytes directly to Cloudinary using io.BytesIO
    try:
        upload_response = cloudinary.uploader.upload(
            io.BytesIO(screenshot_bytes),
            folder="agent_screenshots",
            public_id=unique_name,
            unique_filename=False,  # We guarantee uniqueness ourselves via ts+suffix
            overwrite=False         # Prevent accidental overwrite of previous run shots
        )
        return upload_response.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary direct upload failed: {e}")
        return ""




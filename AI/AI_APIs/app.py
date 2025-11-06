import traceback
import uvicorn
import os
import urllib.parse

import logging
import logging.handlers as handlers

from fastapi import HTTPException, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pydantic import BaseModel
from typing import Any, Dict, List
from datetime import datetime
from PIL import Image

from sqlalchemy import create_engine, MetaData, Table, and_, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.exc import SQLAlchemyError

# ENV Variables Import
ROOT_URL = os.getenv("ROOT_URL")
IMAGE_SIZE = int(os.getenv("IMAGE_SIZE"))  # Default if not passed
NGINX_PATH = os.getenv("NGINX_PATH")
encoded_password = urllib.parse.quote_plus(
    os.getenv("MYSQL_PASS")
)  # Safely encode the password
log_base_directory = os.getenv("LOG_BASE_DIRECTORY")

# ================================== Create the engine ==================================

engine = create_engine(
    f"mysql+mysqlconnector://{os.getenv('MYSQL_USER')}:{encoded_password}@{os.getenv('MYSQL_HOST')}:{os.getenv('MYSQL_PORT')}/{os.getenv('MYSQL_DB_NAME')}"
)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ================================== Base Definition ==================================

Base = declarative_base()

# ================================== Table definition ==================================

metadata = MetaData()

# Reflect existing table
frame_data_table = Table("frames_storage", metadata, autoload_with=engine)

# ================================== Logger Configurations ==================================

# Check if log directory exists
if not log_base_directory:
    raise EnvironmentError(
        "LOG_BASE_DIRECTORY is not set. Please export it before running."
    )

# Construct full log path: <LOG_BASE_DIRECTORY>/logs/
LOG_FILE_PATH = os.path.join(log_base_directory, "logs")
os.makedirs(LOG_FILE_PATH, exist_ok=True)  # Create logs directory if it doesn't exist

# Log formatter: detailed log line with context
FORMATTER = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)s - %(funcName)2s() : %(message)s"
)

# Logging level (can be configured as needed)
LOG_LEVEL = "DEBUG"

# Apply logging level globally
logging.basicConfig(level=LOG_LEVEL)

# Get current date in your desired format: DD-MM-YYYY
today_date_str = datetime.now().strftime("%d-%m-%Y")
log_filename = f"{today_date_str}_ai_apis_logs_file.log"
logger_name = os.path.join(LOG_FILE_PATH, log_filename)

# File Handler
# f_handler = handlers.TimedRotatingFileHandler("logs" + os.sep + "vfs_ai_apis_logs_file", when="midnight", interval=1)
f_handler = handlers.TimedRotatingFileHandler(
    logger_name, when="midnight", backupCount=30, interval=1
)
# f_handler.suffix = "%Y%m%d"
f_handler.setFormatter(FORMATTER)
f_handler.setLevel(LOG_LEVEL)

# # Print Logs in Console, Console Handler (Logs to terminal)
# c_handler = logging.StreamHandler()
# c_handler.setFormatter(FORMATTER)
# c_handler.setLevel(LOG_LEVEL)

# Create/ Initialize logger instance with your required name
logger = logging.getLogger("ai_apis_logger")
logger.addHandler(f_handler)  # Add file Handler
# logger.addHandler(c_handler)  # Add Console Logger

# Inital/ First Log Message
logger.debug("Logger initialized from LOG_BASE_DIRECTORY: %s", log_base_directory)

# ================================== FastAPI Initialization Instance ==================================


app = FastAPI()


# ================================== Dependency to get DB session ==================================


def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


# ================================== SCHEMA DEFINITIONS ==================================


# Pydantic schema for updating camera_status
class CameraStatusUpdate(BaseModel):
    camera_id: int
    frame_time: datetime
    camera_status: Dict[str, Any]


class FrameResponse(BaseModel):
    frame_data: str
    frame_time: datetime


class CaseAIDetails(BaseModel):
    case_id: int
    cameras_rtsp: List[int]


class SuspectDetailsResponse(BaseModel):
    suspect_id: int
    suspect_name: str
    case_id: int
    camera_rtsp_ids: List[int]


# ================================== APIs Defined ==================================


@app.post("/update_camera_status", tags=["Camera"])
def update_camera_status(
        update_data: CameraStatusUpdate, db: Session = Depends(get_db)
):
    """
    Updates the camera status for a specific frame based on frame_time and camera_id.
    If no existing status is found, it initializes it.
    """
    try:
        logger.info(
            f"Request received to update camera status for frame_time: {update_data.frame_time}, camera_id: {update_data.camera_id}"
        )
        logger.debug(f"Incoming camera_status data: {update_data.camera_status}")

        # Fetch the frame with matching frame_time and camera_id
        # frame = db.execute(frame_data_table.select().where(frame_data_table.c.frame_time == update_data.frame_time)).mappings().fetchone()
        frame = (
            db.execute(
                frame_data_table.select().where(
                    and_(
                        frame_data_table.c.frame_time == update_data.frame_time,
                        frame_data_table.c.camera_id == update_data.camera_id,
                    )
                )
            )
            .mappings()
            .fetchone()
        )

        if not frame:
            logger.warning(
                f"No frame found for frame_time: {update_data.frame_time}, camera_id: {update_data.camera_id}"
            )

            raise HTTPException(
                status_code=404, detail="Frame data not found for the given frame_time"
            )

        # Extract current camera_status
        frame = dict(frame)
        current_camera_status = (
            frame["camera_status"] if "camera_status" in frame else None
        )
        logger.info(f"current_camera_status :: {current_camera_status}")

        if current_camera_status is None:
            logger.info("No existing camera_status found, initializing new one.")

            # If no camera_status exists, initialize it with data from the request
            new_camera_status = update_data.camera_status

        else:
            logger.info("Existing camera_status found. Merging with incoming update.")

            # If camera_status exists, parse it and update it with data from the request
            camera_status_dict = (
                current_camera_status
                if isinstance(current_camera_status, dict)
                else current_camera_status
            )

            logger.debug(
                f"Parsed camera_status_dict before merge: {camera_status_dict}"
            )

            # Merge the incoming camera_status with the existing one
            camera_status_dict.update(update_data.camera_status)
            new_camera_status = camera_status_dict

            logger.debug(f"Updated camera_status: {new_camera_status}")

        # Update the database with the new camera_status
        db.execute(
            frame_data_table.update()
            .where(frame_data_table.c.id == frame["id"])
            .values(camera_status=new_camera_status)
        )
        db.commit()

        logger.info(
            f"Camera status updated successfully for frame_time: {update_data.frame_time}"
        )

        return {
            "message": "Camera status updated successfully",
            "frame_time": update_data.frame_time,
        }

    except HTTPException as http_exc:
        # Let FastAPI handle it properly
        raise http_exc

    except SQLAlchemyError as db_error:
        logger.error(
            "In update_camera_status :: Database error occurred while updating camera status."
        )
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Database error occurred.")

    except Exception as e:
        logger.error(
            "In update_camera_status :: Unexpected error occurred while updating camera status."
        )
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/get_frame_by_time", response_model=FrameResponse, tags=["Frames"])
def get_frame_by_time(
        frame_time: datetime, camera_id: int, db: Session = Depends(get_db)
):
    """
    Fetches a frame from the database based on frame_time and camera_id.

    Args:
        frame_time (datetime): Timestamp of the frame to retrieve.
        camera_id (int): ID of the camera associated with the frame.
        db (Session): SQLAlchemy DB session, injected via FastAPI Depends.

    Returns:
        FrameResponse: Frame data as a Pydantic response model.

    Raises:
        HTTPException: 404 if no frame is found, 500 for internal errors.
    """
    try:
        logger.info(
            f"Received request to fetch frame for frame_time: {frame_time}, camera_id: {camera_id}"
        )

        # Search for the frame by frame_time   Construct and execute query
        query = db.execute(
            frame_data_table.select().where(
                and_(
                    frame_data_table.c.frame_time == frame_time,
                    frame_data_table.c.camera_id == camera_id,
                )
            )
        )

        logger.debug(f"query : {query.__dict__}")

        frame = query.mappings().fetchone()
        logger.debug(f"Query result: {frame}")

        if not frame:
            logger.warning(
                f"No frame found for frame_time: {frame_time}, camera_id: {camera_id}"
            )
            raise HTTPException(
                status_code=404, detail="Frame data not found for the given frame_time"
            )

        logger.info(f"Frame data retrieved successfully for frame_time: {frame_time}")

        # Always ensure the returned frame_data points to ROOT_URL/raw_frames/<filename>
        try:
            frame_dict = dict(frame)
            if "frame_data" in frame_dict and isinstance(frame_dict["frame_data"], str):
                parsed = urllib.parse.urlparse(frame_dict["frame_data"])
                # Extract filename from either URL path or raw string
                src_filename = os.path.basename(
                    parsed.path if parsed.path else frame_dict["frame_data"]) or os.path.basename(
                    frame_dict["frame_data"])
                # Normalize ROOT_URL
                normalized_root = ROOT_URL.rstrip("/") if ROOT_URL else ""
                # Construct URL pointing to raw_frames
                frame_dict["frame_data"] = f"{normalized_root}/raw_frames/{src_filename}" if normalized_root else \
                    frame_dict["frame_data"]
                logger.debug(f"Rewritten frame_data to raw_frames URL: {frame_dict['frame_data']}")
            return frame_dict
        except Exception:
            # If any rewriting fails, return the original mapping
            logger.warning("Failed to normalize frame_data to raw_frames. Returning original frame mapping.")
            return frame

    except HTTPException as http_exc:
        # Let FastAPI handle this properly
        raise http_exc

    except SQLAlchemyError as db_err:
        logger.error(
            "In get_frame_by_time :: Database error while fetching frame by time."
        )
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Database error occurred.")

    except Exception as e:
        logger.error(
            "In get_frame_by_time :: Unexpected error while fetching frame by time."
        )
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error.")


@app.get(
    "/store_suspect_details", response_model=SuspectDetailsResponse, tags=["Suspects"]
)
def get_suspect_details(suspect_id: int, db=Depends(get_db)):
    try:
        # Fetch suspect details
        suspect_query = text(
            """
            SELECT id, suspect_name, suspect_image_url, case_id
            FROM suspect
            WHERE id = :suspect_id
              AND deleted = FALSE
            """
        )
        suspect = db.execute(suspect_query, {"suspect_id": suspect_id}).fetchone()

        if not suspect:
            raise HTTPException(status_code=404, detail="Suspect not found")

        # Fetch case details
        case_id = suspect.case_id
        case_query = text(
            """
            SELECT id
            FROM `case`
            WHERE id = :case_id
              AND deleted = FALSE
            """
        )
        case = db.execute(case_query, {"case_id": case_id}).fetchone()

        if not case:
            raise HTTPException(status_code=404, detail="Associated case not found")

        # Fetch associated camera RTSP IDs
        camera_query = text(
            """
            SELECT camera_rtsp.id
            FROM camera_rtsp
                     JOIN case_camera_rtsp_mapping
                          ON camera_rtsp.id = case_camera_rtsp_mapping.camera_rtsp_id
            WHERE case_camera_rtsp_mapping.case_id = :case_id
              AND camera_rtsp.deleted = FALSE
            """
        )

        cameras = db.execute(camera_query, {"case_id": case_id}).fetchall()
        camera_rtsp_ids = [str(camera.id) for camera in cameras]
        # 0
        return SuspectDetailsResponse(
            suspect_id=suspect.id,
            suspect_name=suspect.suspect_name,
            case_id=case_id,
            camera_rtsp_ids=camera_rtsp_ids,
        )

    except HTTPException as http_exc:
        raise http_exc

    except SQLAlchemyError as db_exc:
        raise HTTPException(status_code=500, detail="Database error")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/image_copy", tags=["Frames"])
async def image_copy(
        image_source_url: str, image_des_url: str, image_size: int = IMAGE_SIZE
):
    logger.debug(f"Received image_source_url: {image_source_url}")
    logger.debug(f"Received image_des_url: {image_des_url}")
    logger.debug(f"Target image size: {image_size}")
    logger.debug(f"Configured NGINX_PATH: {NGINX_PATH}")
    logger.debug(f"Configured ROOT_URL: {ROOT_URL}")

    # Enforce folder policy while preserving full subpath under site root
    # Convert URLs to filesystem paths by replacing ROOT_URL with NGINX_PATH
    normalized_root = ROOT_URL.rstrip("/") if ROOT_URL else ""

    def url_to_fs(url: str) -> str:
        path = url.strip()
        if normalized_root and path.startswith(normalized_root):
            path = path.replace(normalized_root, NGINX_PATH, 1)
        # Normalize duplicate slashes
        path = path.replace("//", "/")
        return path

    # Build source path and force raw_frames segment
    image_source_path = url_to_fs(image_source_url)
    if "/raw_frames/" not in image_source_path:
        image_source_path = image_source_path.replace("/events/", "/raw_frames/")

    # Build destination path and force events segment
    image_dest_path = url_to_fs(image_des_url)
    if "/events/" not in image_dest_path:
        image_dest_path = image_dest_path.replace("/raw_frames/", "/events/")

    logger.debug(f"Resolved image_source_path: {image_source_path}")
    logger.debug(f"Resolved image_dest_path: {image_dest_path}")

    dest_dir = os.path.dirname(image_dest_path)
    logger.debug(f"Destination directory: {dest_dir}")

    try:
        # Ensure destination directory exists
        if not os.path.exists(dest_dir):
            logger.debug(f"Destination directory does not exist. Creating...")
            os.makedirs(dest_dir, exist_ok=True)
        else:
            logger.debug(f"Destination directory already exists.")

        # Do not overwrite existing files; enforce exact filename from destination URL
        if os.path.exists(image_dest_path):
            logger.warning(f"Destination already exists, not overwriting: {image_dest_path}")
            return JSONResponse(
                status_code=409,
                content={
                    "error": "Destination file already exists; not overwriting",
                    "destination": image_dest_path,
                },
            )

        # Check if source file exists
        source_exists = os.path.exists(image_source_path)
        logger.info(
            f"Checking if image source exists at '{image_source_path}': {source_exists}"
        )

        is_file = os.path.isfile(image_source_path)
        logger.info(
            f"Checking if image source is a file at '{image_source_path}': {is_file}"
        )

        if not (source_exists and is_file):
            logger.error("ERROR: Source file not found or not a valid file.")
            return JSONResponse(
                status_code=404,
                content={
                    "error": "Source image not found",
                    "resolved_path": image_source_path,
                    "exists": source_exists,
                    "is_file": is_file,
                },
            )

        # Open and resize the image
        with Image.open(image_source_path) as img:
            logger.debug(f"\nOriginal image size: {img.size}")
            resized_img = img.resize((image_size, image_size), Image.Resampling.LANCZOS)
            logger.debug(f"\nResized image to: {resized_img.size}")

            # Save to destination
            logger.debug(f"Saving resized image to: {image_dest_path}")
            resized_img.save(image_dest_path)
            logger.info("SUCCESS: Image saved.")

        return {
            "message": "Image copied and resized successfully",
            "destination": image_dest_path,
        }

    except FileNotFoundError as fnf_error:
        logger.error("FileNotFoundError caught.")
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=404, content={"error": f"File not found: {fnf_error}"}
        )

    except Exception as e:
        logger.error("Unexpected exception caught during image processing:")
        logger.error(traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.delete("/delete_image", tags=["Frames"])
async def delete_image(image_source_url: str):
    """
    Deletes an image file from the given path after replacing the IP with DESTINATION_PATH.
    """
    logger.debug(f" Raw image_source_url: {image_source_url}")
    logger.debug(f"Configured ROOT_URL: {ROOT_URL}")
    logger.debug(f"Configured NGINX_PATH: {NGINX_PATH}")

    # Ensure consistency of URL format
    normalized_root_url = ROOT_URL.rstrip("/")
    normalized_image_url = image_source_url.strip()

    if not normalized_image_url.startswith(normalized_root_url):
        logger.error("ERROR: image_source_url does not start with ROOT_URL.")
        return JSONResponse(
            status_code=400, content={"error": "Invalid image_source_url format."}
        )

    # Perform path replacement
    image_source_path = normalized_image_url.replace(normalized_root_url, NGINX_PATH)
    image_source_path = image_source_path.replace("//", "/")  # Normalize path slashes

    file_exists = os.path.exists(image_source_path)
    is_file = os.path.isfile(image_source_path)

    # if os.path.exists(image_source_path):
    if file_exists and is_file:
        try:
            os.remove(image_source_path)
            logger.info("SUCCESS: File deleted.")
            return {"message": "Image deleted successfully", "path": image_source_path}
        except Exception as e:
            logger.error(f"EXCEPTION: Error while deleting the file -> {e}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Exception during deletion: {str(e)}"},
            )
            # return {"error": f"Error deleting image: {e}"}
    else:
        logger.error("ERROR: File not found or is not a file.")
        # return {"error": "Image not found"}
        return JSONResponse(
            status_code=404,
            content={
                "error": "Image not found",
                "derived_path": image_source_path,
                "exists": file_exists,
                "is_file": is_file,
            },
        )


# ==================== FastApi Configs ====================

# Allow cross-origin requests (Optional)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Run the FastAPI from file ====================

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

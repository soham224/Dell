import subprocess
from datetime import datetime, timedelta
from typing import Optional

import ffmpeg
from ffmpeg import probe
from jose import jwt
import time
from core.config import settings
import logging
import os
from starlette.responses import FileResponse
from starlette.responses import StreamingResponse
from io import BytesIO


# from core.aws_utils import upload_image_to_s3


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.utcnow()
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm="HS256",
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> Optional[str]:
    try:
        decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        logging.info("decoded_token :: {}".format(decoded_token))
        return decoded_token["sub"]
    except jwt.JWTError:
        return None


def check_rtsp(rtsp: str):
    try:
        logging.info("Checking status for : {} ".format(rtsp))
        if rtsp:
            metadata = probe(rtsp, rtsp_transport="tcp")["format"]["probe_score"]
            if metadata:
                return True
            else:
                return False
        else:
            return False
    except Exception as e:
        logging.error("Exception check_rtsp : {}".format(e))
        return False


def check_rtsp_new(rtsp: str):
    """Check RTSP reachability by grabbing a single frame via ffmpeg.

    Improvements:
    - Use TCP transport explicitly for better reliability across networks.
    - Increase timeout (default 15s) and make it configurable via env CHECK_RTSP_TIMEOUT.
    - Overwrite output file if it exists (-y) and improve error logging with stderr.
    """
    logger = logging.getLogger("sentry_logger")
    file_name = f"{int(time.time())}.png"
    logging.info(f"Checking status for : {rtsp} || {file_name}")

    # Configurable timeout in seconds via environment variable, default 15
    try:
        timeout_s = int(os.getenv("CHECK_RTSP_TIMEOUT", "15"))
    except Exception:
        timeout_s = 15

    if rtsp:
        try:
            # Command to fetch one frame from RTSP using TCP transport
            cmd = [f"ffmpeg -rtsp_transport tcp -i '{rtsp}' -vframes 1 -y {file_name}"]
            # Run ffmpeg command using subprocess
            res = subprocess.run(
                cmd, capture_output=True, check=True, shell=True, timeout=timeout_s
            )
        except subprocess.TimeoutExpired as e:
            logger.error(f"TimeoutExpired in check_rtsp (>{timeout_s}s): {e}")
            return False
        except subprocess.CalledProcessError as e:
            stderr = e.stderr.decode(errors="ignore") if e.stderr else ""
            logger.error(
                f"CalledProcessError in check_rtsp (code={e.returncode}): {stderr[:500]}"
            )
            return False
        except Exception as e:
            logger.error(f"Exception in check_rtsp : {e}")
            return False

        # check if frame is stored or not
        if os.path.isfile(file_name):
            try:
                os.remove(file_name)
            except Exception:
                pass
            return True
        return False
    else:
        return False


# def check_rtsp_for_frame(rtsp: str, camera_id, camera_name, user_id):
#     try:
#         file_name = "{}.png".format(str(int(time.time())))
#         logging.info("Checking status for : {} || {}".format(rtsp, file_name))
#
#         if rtsp:
#             # fetch and the first frame from rtsp
#             out, _ = (
#                 ffmpeg.input(rtsp, rtsp_transport="tcp")
#                 .output(file_name, vframes=1)
#                 .run(quiet=True)
#             )
#
#             # check if frame is stored or not
#             if os.path.isfile(file_name):
#                 s3_key = (
#                     "as/"
#                     + str(user_id)
#                     + "/"
#                     + "ROI"
#                     + "/"
#                     + str(camera_id)
#                     + "/"
#                     + camera_name
#                     + ".png"
#                 )
#                 image_url = upload_image_to_s3(
#                     file_name, s3_key, settings.TEST_IMG_STORAGE_BUCKET, True
#                 )
#                 return image_url
#             else:
#                 return None
#         else:
#             return None
#     except Exception as e:
#         logging.error("Exception check_rtsp : {}".format(e))
#         return None

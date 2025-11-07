import urllib
from urllib.parse import urlparse
import config as cfg
import requests
from utils.datasets import *
from utils.general import *
from utils.torch_utils import *
from datetime import datetime, timezone
from collections import defaultdict
import mysql.connector
import json
import os
from typing import List, Dict, Any, Optional, Tuple
import cv2
import numpy as np

format = "%Y-%m-%d %H:%M:%S"

ADD_RESULT_URL = os.getenv("ADD_RESULT_URL")

conn = mysql.connector.connect(
    host=cfg.MYSQL_HOST,
    user=cfg.MYSQL_USER,
    password=cfg.MYSQL_PASS,
    database=cfg.MYSQL_DB_NAME,
    port=cfg.MYSQL_PORT,
)

cfg.logger.info(f"Connected to :: {conn}")


def store_result(file_name, file_path, file_url, bounding_box, frame_time, camera_id):
    """Persist result to ADD_RESULT_URL matching MongoDB schema.

    Maps to:
    {
      user_id, camera_id, image_name, image_url,
      result, is_hide, created_date, updated_date, status,
      counts, video_url, frame_date
    }
    """

    # Timestamps in UTC ISO format
    now_iso = datetime.now(timezone.utc).isoformat()
    if isinstance(frame_time, datetime):
        frame_iso = frame_time.astimezone(timezone.utc).isoformat()
    else:
        try:
            # Expecting '%Y-%m-%d %H:%M:00' in UTC
            dt = datetime.strptime(str(frame_time), "%Y-%m-%d %H:%M:%S").replace(
                tzinfo=timezone.utc
            )
            frame_iso = dt.isoformat()
        except Exception:
            # Fallback to now if parsing fails
            frame_iso = now_iso

    # Derive image_name from URL path
    try:
        image_path_from_url = urlparse(file_url).path or ""
    except Exception:
        image_path_from_url = f"/{file_name}" if file_name else ""

    # Compute counts from detections
    counts: dict = defaultdict(int)
    for det in (
        bounding_box.get("detection", []) if isinstance(bounding_box, dict) else []
    ):
        lbl = det.get("label")
        if lbl:
            counts[lbl] += 1

    payload = {
        "user_id": str(cfg.USER_ID or ""),
        "camera_id": str(camera_id),
        "image_name": image_path_from_url,
        "image_url": file_url,
        "result": {
            "detection": (
                bounding_box.get("detection", [])
                if isinstance(bounding_box, dict)
                else []
            )
        },
        "is_hide": False,
        "created_date": now_iso,
        "updated_date": now_iso,
        "status": True,
        "counts": dict(counts),
        "video_url": "",
        "frame_date": frame_iso,
    }
    try:
        cfg.logger.debug(
            "Posting add_result | url=%s camera_id=%s file=%s payload_keys=%s",
            ADD_RESULT_URL,
            camera_id,
            file_name,
            list(payload.keys()),
        )
        t_post_start = time_synchronized()
        response = requests.post(ADD_RESULT_URL, json=payload)
        t_post_end = time_synchronized()
        cfg.perf_logger.info(
            "add_result latency_ms=%.2f camera_id=%s status=%s",
            (t_post_end - t_post_start) * 1000,
            camera_id,
            response.status_code,
        )
        # Check the response status
        if response.status_code == 200:
            try:
                cfg.logger.info(
                    "Result added successfully | camera_id=%s file=%s",
                    camera_id,
                    file_name,
                )
                cfg.logger.debug("add_result response: %s", response.json())
            except Exception:
                cfg.logger.debug(
                    "add_result non-JSON response body: %s",
                    getattr(response, "text", ""),
                )
        else:
            cfg.logger.error(
                "Failed to add result | status=%s body=%s",
                response.status_code,
                getattr(response, "text", ""),
            )
    except Exception as e:
        cfg.logger.exception("Exception during add_result post: %s", e)


def get_device():
    return select_device("cpu")


def load_model(weight_path, map_location):
    cfg.logger.info("Load Model")
    return (
        torch.load(weight_path, map_location=map_location)["model"]
        .float()
        .fuse()
        .eval()
    )


def load_image_from_url(image_path, img_size=640):
    try:
        if image_path:
            req = urllib.request.urlopen(image_path)
            arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
            img0 = cv2.imdecode(arr, -1)
            img = letterbox(img0, new_shape=img_size, scaleup=False)[0]
            img = img[:, :, ::-1].transpose(2, 0, 1)  # to 3x416x416
            img = np.ascontiguousarray(img)
            return img, img0, image_path
        else:
            cfg.logger.error("ERROR: image not found from URL")
            return False
    except Exception as e:
        cfg.logger.error(f"Error in load_image_from_url :: {e}")
        return False


def load_image_from_disk(image_path, img_size=640):
    try:
        if os.path.exists(image_path):
            img0 = cv2.imread(image_path)
            img = letterbox(img0, new_shape=img_size, scaleup=False)[0]
            img = img[:, :, ::-1].transpose(2, 0, 1)  # to 3x416x416
            img = np.ascontiguousarray(img)
            return img, img0, image_path
        else:
            cfg.logger.error("ERROR: image not found in local")
    except Exception as e:
        cfg.logger.error(f"Error in load_image_from_disk :: {e}")
        return False


def predict(model, img, im0s, device, conf_thres, iou_thres, usecase, camera_id):
    try:
        cfg.logger.info("In Prediction")
        cfg.logger.debug(f"Device: {device}")
        cfg.logger.debug(f"Confidence Threshold: {conf_thres}")
        cfg.logger.debug(f"IOU Threshold: {iou_thres}")
        cfg.logger.debug(f"Usecase: {usecase}")
        cfg.logger.debug(f"Camera ID: {camera_id}")
        cfg.logger.debug(f"Original image shape (im0s): {im0s.shape}")
        cfg.logger.debug(f"Input image shape (img): {img.shape}")

        # cfg.logger.info(f"model: {model}")
        names = model.module.names if hasattr(model, "module") else model.names
        cfg.logger.debug(f"Class names: {names}")

        img = torch.from_numpy(img).to(device)
        img = img.float()  # uint8 to fp16/32
        img /= 255.0  # 0 - 255 to 0.0 - 1.0

        if img.ndimension() == 3:
            img = img.unsqueeze(0)

        # Inference
        t1 = time_synchronized()
        pred = model(img)[0]

        # Apply NMS for all classes (PPE model emits: no_vest, no_hardhat, hardhat, vest)
        pred = non_max_suppression(
            pred, conf_thres, iou_thres, classes=None, agnostic=False
        )
        t2 = time_synchronized()
        cfg.logger.debug(f"NMS completed in {t2 - t1:.4f} seconds")

        result_dict = {}
        result_list = []
        for i, det in enumerate(pred):  # detections per image

            cfg.logger.debug(
                f"Processing image {i} - Detection found: {det is not None and len(det) > 0}"
            )

            if det is not None and len(det):
                cfg.logger.info("{} detections found.".format(len(det)))

                # Rescale boxes from img_size to im0 size
                det[:, :4] = scale_coords(img.shape[2:], det[:, :4], im0s.shape).round()
                for *xyxy, conf, cls in det:
                    tmp_dict = {}
                    x1 = int(xyxy[0])
                    y1 = int(xyxy[1])
                    x2 = int(xyxy[2])
                    y2 = int(xyxy[3])
                    tmp_dict["label"] = names[int(cls)]
                    tmp_dict["location"] = [x1, y1, x2, y2]
                    result_list.append(tmp_dict)

                    cfg.logger.debug(
                        f"Detection added - Label: {tmp_dict['label']}, "
                        f"Box: {tmp_dict['location']}, Conf: {conf:.2f}"
                    )

        result_dict["detection"] = result_list
        result_dict["inference_time"] = t2 - t1

        cfg.logger.debug(f"Final Result Dictionary: {result_dict}")

        return result_dict

    except Exception as e:
        cfg.logger.error("An error occurred in predict() :: %s", str(e))


def predict_raw(
    model,
    img,
    im0s,
    device,
    conf_thres: float,
    iou_thres: float,
    target_label: Optional[str] = None,
):
    """
    Run inference and return both formatted detections and raw tensors for tracking.

    Returns:
    - result_dict: {"detection": [{label, location}], "inference_time": float}
    - det_tensor: torch.Tensor for the first image after NMS and class filtering (xyxy, conf, cls)
    - names: list of class names

    If target_label is provided (e.g., "head"), detections are filtered to that class.
    """
    try:
        cfg.logger.info("In predict_raw")
        names = model.module.names if hasattr(model, "module") else model.names
        target_idx = None
        if target_label is not None:
            try:
                target_idx = names.index(target_label)
                cfg.logger.debug("Target label '%s' mapped to index %s", target_label, target_idx)
            except ValueError:
                cfg.logger.warning("Target label '%s' not found in model names: %s", target_label, names)

        img_t = torch.from_numpy(img).to(device)
        img_t = img_t.float()
        img_t /= 255.0
        if img_t.ndimension() == 3:
            img_t = img_t.unsqueeze(0)

        t1 = time_synchronized()
        pred = model(img_t)[0]
        pred = non_max_suppression(pred, conf_thres, iou_thres, classes=None, agnostic=False)
        t2 = time_synchronized()

        result_dict: Dict[str, Any] = {"detection": [], "inference_time": t2 - t1}
        det_tensor = None
        for i, det in enumerate(pred):
            if det is not None and len(det):
                # filter by class if requested
                if target_idx is not None:
                    det = det[det[:, -1] == target_idx]
                if len(det) == 0:
                    continue
                det[:, :4] = scale_coords(img_t.shape[2:], det[:, :4], im0s.shape).round()
                det_tensor = det
                for *xyxy, conf, cls in det:
                    x1 = int(xyxy[0])
                    y1 = int(xyxy[1])
                    x2 = int(xyxy[2])
                    y2 = int(xyxy[3])
                    result_dict["detection"].append(
                        {"label": names[int(cls)], "location": [x1, y1, x2, y2]}
                    )
        cfg.logger.debug("predict_raw result count=%d", len(result_dict["detection"]))
        return result_dict, det_tensor, names
    except Exception as e:
        cfg.logger.error("An error occurred in predict_raw() :: %s", str(e))
        return {"detection": [], "inference_time": 0.0}, None, []


def update_label(result_dict, img, usecases):
    try:
        """PPE use case: no label overrides are required.

        Previously used to collapse person counts into a single crowd box. For PPE
        detection we preserve model outputs as-is. This function becomes a no-op
        pass-through to keep backward compatibility where it's still invoked.
        """
        cfg.logger.debug("update_label() no-op for PPE; returning original results")
        return result_dict
    except Exception as e:
        cfg.logger.error("Exception in update_label(): " + str(e))
        return result_dict


def convert_coordinates(orig_coords, orig_size=(1920, 1080), new_size=(640, 640)):
    """
    Convert coordinates (x1, y1, x2, y2) from original image size to new image size.

    Parameters:
    - orig_coords: Original coordinates of the bounding box.
    - orig_size: Width and height of the original image.
    - new_size: Width and height of the new resized image.

    Returns:
    - New coordinates (x1_new, y1_new, x2_new, y2_new).
    """
    try:
        x1, y1, x2, y2 = orig_coords
        w_orig, h_orig = orig_size
        w_new, h_new = new_size

        x1_new = int(x1 * (w_new / w_orig))
        y1_new = int(y1 * (h_new / h_orig))
        x2_new = int(x2 * (w_new / w_orig))
        y2_new = int(y2 * (h_new / h_orig))

        return [x1_new, y1_new, x2_new, y2_new]
    except Exception as e:
        cfg.logger.error(f"Error in Convert Coordinates :: {e}")
        return None


def get_roi_by_result_type_id_and_camera_rtsp_id(result_type_id, camera_rtsp_id):
    try:
        cursor = conn.cursor(dictionary=True)
        # Use result_type_id as usecase_id and camera_rtsp_id as camera_id based on new schema
        query = (
            f"SELECT * FROM {cfg.RESULT_MAPPING_TABLE_NAME} "
            "WHERE status = 1 "
            "AND usecase_id = %s "
            "AND camera_id = %s "
            "AND start_time_utc <= UTC_TIMESTAMP() "
            "AND end_time_utc >= UTC_TIMESTAMP() "
            "ORDER BY id DESC LIMIT 1"
        )
        cfg.logger.debug(
            "Fetching ROI mapping | table=%s usecase_id=%s camera_id=%s",
            cfg.RESULT_MAPPING_TABLE_NAME,
            result_type_id,
            camera_rtsp_id,
        )
        cursor.execute(query, (result_type_id, camera_rtsp_id))
        row = cursor.fetchone()
        cursor.close()

        if not row:
            # Try to fetch most recent mapping to print its configured time range for visibility
            try:
                cursor = conn.cursor(dictionary=True)
                fallback_q = (
                    f"SELECT id, start_time_utc, end_time_utc, status, labels FROM {cfg.RESULT_MAPPING_TABLE_NAME} "
                    "WHERE usecase_id = %s AND camera_id = %s ORDER BY id DESC LIMIT 1"
                )
                cursor.execute(fallback_q, (result_type_id, camera_rtsp_id))
                latest = cursor.fetchone()
                cursor.close()
            except Exception:
                latest = None

            now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
            if latest:
                start_str = str(latest.get("start_time_utc"))
                end_str = str(latest.get("end_time_utc"))
                cfg.logger.info(
                    "No active mapping found for camera_id=%s usecase_id=%s within time window | now_utc=%s | last_range=[%s .. %s] status=%s labels=%s",
                    camera_rtsp_id,
                    result_type_id,
                    now_utc,
                    start_str,
                    end_str,
                    latest.get("status"),
                    latest.get("labels"),
                )
            else:
                cfg.logger.info(
                    "No active mapping found for camera_id=%s usecase_id=%s within time window | now_utc=%s | no mappings configured",
                    camera_rtsp_id,
                    result_type_id,
                    now_utc,
                )
            return None

        # Validate labels contains at least one of the required PPE labels
        required_labels = {"no_vest", "no_hardhat", "vest", "hardhat"}
        labels_field = row.get("labels")
        labels_list = []
        if labels_field:
            try:
                # Try JSON parse first (supports list or dict formats)
                parsed = (
                    json.loads(labels_field)
                    if isinstance(labels_field, str)
                    else labels_field
                )
                if isinstance(parsed, dict):
                    # Expected format: {"ppe": ["no_vest", "no_hardhat", "vest", "hardhat"]}
                    # If any other usecase key is provided instead of 'ppe', do not consider mapping
                    if "ppe" not in parsed:
                        cfg.logger.info(
                            "Labels provided for a non-PPE usecase; ignoring mapping | camera_id=%s labels_keys=%s",
                            camera_rtsp_id,
                            list(parsed.keys()),
                        )
                        return None
                    ppe_list = parsed.get("ppe")
                    if isinstance(ppe_list, list):
                        labels_list = [str(x).strip() for x in ppe_list]
                    else:
                        labels_list = []
                elif isinstance(parsed, list):
                    labels_list = [str(x).strip() for x in parsed]
                else:
                    # Fallback to comma-separated
                    labels_list = [
                        s.strip() for s in str(labels_field).split(",") if s.strip()
                    ]
            except Exception:
                # Fallback to comma-separated
                labels_list = [
                    s.strip() for s in str(labels_field).split(",") if s.strip()
                ]

        has_required = any(lbl in required_labels for lbl in labels_list)
        if not has_required:
            cfg.logger.info(
                "Mapping labels do not include required PPE labels | camera_id=%s labels=%s",
                camera_rtsp_id,
                labels_list,
            )
            return None

        cfg.logger.debug(
            "Active ROI mapping accepted | camera_id=%s usecase_id=%s labels=%s",
            camera_rtsp_id,
            result_type_id,
            labels_list,
        )
        # Attach the allowed labels for downstream filtering in app.py
        row["allowed_labels"] = labels_list
        return row
    except Exception as e:
        cfg.logger.info(
            "An error occurred in get_roi_by_result_type_id_and_camera_rtsp_id :: %s",
            str(e),
        )


def get_all_camera():
    try:
        cursor = conn.cursor(dictionary=True)
        query = f"SELECT * FROM {cfg.CAMERA_TABLE_NAME}"
        cfg.logger.debug("Fetching cameras from table: %s", cfg.CAMERA_TABLE_NAME)
        cursor.execute(
            query,
        )
        result = cursor.fetchall()
        cursor.close()
        return result
    except Exception as e:
        cfg.logger.error("An error occurred in get_all_camera :: %s", str(e))
        # Return empty list to allow the app loop to continue gracefully
        return []


# ============================ ROI Utilities ============================
def parse_roi_boxes(roi_raw: Any) -> List[List[int]]:
    """Parse ROI boxes from DB value to a list of [x1,y1,x2,y2].

    The DB column may store JSON like: {"location": [[x1,y1,x2,y2], ...]}
    or directly a list of boxes. Any invalid entries are ignored.
    """
    boxes: List[List[int]] = []
    try:
        if not roi_raw:
            return boxes
        data = json.loads(roi_raw) if isinstance(roi_raw, str) else roi_raw
        if isinstance(data, dict) and "location" in data:
            cand = data.get("location", [])
        else:
            cand = data
        if isinstance(cand, list):
            for item in cand:
                if (
                    isinstance(item, (list, tuple))
                    and len(item) == 4
                    and all(isinstance(v, (int, float)) for v in item)
                ):
                    x1, y1, x2, y2 = item
                    if x2 > x1 and y2 > y1:
                        boxes.append([int(x1), int(y1), int(x2), int(y2)])
        return boxes
    except Exception as e:
        cfg.logger.warning("Failed to parse ROI boxes: %s", e)
        return []


def box_center(box: List[int]) -> Tuple[int, int]:
    """Return integer center (cx, cy) of a box [x1,y1,x2,y2]."""
    x1, y1, x2, y2 = box
    return int((x1 + x2) / 2), int((y1 + y2) / 2)


def point_in_box(pt: Tuple[int, int], box: List[int]) -> bool:
    """Check if point lies strictly inside the box."""
    x, y = pt
    x1, y1, x2, y2 = box
    return x1 <= x <= x2 and y1 <= y <= y2


def filter_detections_by_rois(detections: List[Dict[str, Any]], rois: List[List[int]]) -> List[Dict[str, Any]]:
    """Keep detections whose center lies inside any ROI.

    This is a stable and efficient filter criterion and avoids edge cases
    where large boxes only slightly intersect an ROI.
    """
    if not rois:
        return detections
    kept: List[Dict[str, Any]] = []
    for det in detections or []:
        loc = det.get("location")
        if not (isinstance(loc, (list, tuple)) and len(loc) == 4):
            continue
        cx, cy = box_center([int(loc[0]), int(loc[1]), int(loc[2]), int(loc[3])])
        for roi in rois:
            if point_in_box((cx, cy), roi):
                kept.append(det)
                break
    return kept


def draw_rois(image: np.ndarray, rois: List[List[int]], color=(0, 255, 255), thickness: int = 2) -> np.ndarray:
    """Draw ROI rectangles with a small 'ROI' title on each rectangle.

    Returns the modified image (in place mutation also happens).
    """
    if image is None or not isinstance(image, np.ndarray):
        return image
    for idx, roi in enumerate(rois or []):
        if not (isinstance(roi, (list, tuple)) and len(roi) == 4):
            continue
        x1, y1, x2, y2 = map(int, roi)
        cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)
        label = f"PPE ROI"
        ((tw, th), baseline) = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        y_text = max(y1 - 6, th + 6)
        cv2.rectangle(image, (x1, y_text - th - baseline - 4), (x1 + tw + 6, y_text + baseline), color, -1)
        cv2.putText(image, label, (x1 + 3, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2, cv2.LINE_AA)
    return image


def save_overlay_image(base_img: np.ndarray, out_disk_path: str) -> Optional[str]:
    """Save the provided image to disk, creating parent directories as needed.

    Returns the same path on success, None on failure.
    """
    try:
        os.makedirs(os.path.dirname(out_disk_path), exist_ok=True)
        ok = cv2.imwrite(out_disk_path, base_img)
        return out_disk_path if ok else None
    except Exception as e:
        cfg.logger.warning("Failed to save overlay image at %s: %s", out_disk_path, e)
        return None


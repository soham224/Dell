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
from typing import List, Tuple, Optional

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
    """Fetch active mapping for a camera/usecase and verify it targets intrusion.

    The mapping is considered valid if its labels contain the string "intrusion".
    ROI may be empty or invalid; downstream logic will treat empty ROI as full frame.
    """
    try:
        cursor = conn.cursor(dictionary=True)
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
            # Log most recent configuration window for visibility
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
                cfg.logger.info(
                    "No active mapping for camera_id=%s usecase_id=%s | now_utc=%s | last_range=[%s .. %s] status=%s labels=%s",
                    camera_rtsp_id,
                    result_type_id,
                    now_utc,
                    str(latest.get("start_time_utc")),
                    str(latest.get("end_time_utc")),
                    latest.get("status"),
                    latest.get("labels"),
                )
            else:
                cfg.logger.info(
                    "No active mapping for camera_id=%s usecase_id=%s | now_utc=%s | no mappings configured",
                    camera_rtsp_id,
                    result_type_id,
                    now_utc,
                )
            return None

        # Validate labels contain "intrusion"
        labels_field = row.get("labels")
        labels_list: List[str] = []
        if labels_field:
            try:
                parsed = (
                    json.loads(labels_field)
                    if isinstance(labels_field, str)
                    else labels_field
                )
                if isinstance(parsed, dict):
                    # Accept any key; flatten to list
                    for v in parsed.values():
                        if isinstance(v, list):
                            labels_list.extend([str(x).strip().lower() for x in v])
                elif isinstance(parsed, list):
                    labels_list = [str(x).strip().lower() for x in parsed]
                else:
                    labels_list = [
                        s.strip().lower()
                        for s in str(labels_field).split(",")
                        if s.strip()
                    ]
            except Exception:
                labels_list = [
                    s.strip().lower() for s in str(labels_field).split(",") if s.strip()
                ]

        if "intrusion" not in set(labels_list):
            cfg.logger.info(
                "Mapping labels do not include 'intrusion' | camera_id=%s labels=%s",
                camera_rtsp_id,
                labels_list,
            )
            return None

        cfg.logger.debug(
            "Active intrusion mapping accepted | camera_id=%s usecase_id=%s labels=%s",
            camera_rtsp_id,
            result_type_id,
            labels_list,
        )
        return row
    except Exception as e:
        cfg.logger.info(
            "An error occurred in get_roi_by_result_type_id_and_camera_rtsp_id :: %s",
            str(e),
        )


def _parse_roi_list(roi_raw) -> List[List[Tuple[int, int]]]:
    """Parse ROI JSON from DB into list of polygons [[(x,y),...], ...].

    Supports formats:
    - Dict with bounding boxes: {"location": [[x1,y1,x2,y2], ...]}
    - List of points dicts: [{"x":10,"y":20}, ...]
    - List of [x,y]
    - List of polygons (list of lists of points)
    Returns empty list on failure.
    """
    polys: List[List[Tuple[int, int]]] = []
    try:
        data = json.loads(roi_raw) if isinstance(roi_raw, str) else roi_raw

        # Case 1: Dict with 'location' holding list of [x1,y1,x2,y2] rectangles
        if isinstance(data, dict) and "location" in data:
            locs = data.get("location")
            if isinstance(locs, list):
                for box in locs:
                    if (
                        isinstance(box, (list, tuple))
                        and len(box) == 4
                        and all(isinstance(v, (int, float)) for v in box)
                    ):
                        x1, y1, x2, y2 = [int(v) for v in box]
                        # Convert rectangle to polygon (clockwise)
                        polys.append([(x1, y1), (x2, y1), (x2, y2), (x1, y2)])
            return polys

        # Case 2: List-like data (points or polygons)
        if not isinstance(data, list):
            return []
        # Detect whether first level already multiple polygons
        candidate = data
        if len(data) and all(isinstance(p, (list, tuple, dict)) for p in data):
            # If first element is a point, wrap into one polygon
            is_point = False
            first = data[0]
            if isinstance(first, dict) and {"x", "y"}.issubset(first.keys()):
                is_point = True
            if (
                isinstance(first, (list, tuple))
                and len(first) == 2
                and all(isinstance(v, (int, float)) for v in first)
            ):
                is_point = True
            if is_point:
                candidate = [data]
        for poly in candidate:
            pts: List[Tuple[int, int]] = []
            if isinstance(poly, list):
                for pt in poly:
                    if isinstance(pt, dict) and "x" in pt and "y" in pt:
                        pts.append((int(pt["x"]), int(pt["y"])) )
                    elif isinstance(pt, (list, tuple)) and len(pt) == 2:
                        pts.append((int(pt[0]), int(pt[1])))
            if pts:
                polys.append(pts)
        return polys
    except Exception:
        return []


def _point_in_polygon(x: int, y: int, polygon: List[Tuple[int, int]]) -> bool:
    """Ray casting algorithm to test if point is inside polygon."""
    inside = False
    n = len(polygon)
    if n < 3:
        return False
    px1, py1 = polygon[0]
    for i in range(1, n + 1):
        px2, py2 = polygon[i % n]
        if min(py1, py2) < y <= max(py1, py2) and x <= max(px1, px2):
            if py1 != py2:
                xinters = (y - py1) * (px2 - px1) / (py2 - py1) + px1
            else:
                xinters = x
            if px1 == px2 or x <= xinters:
                inside = not inside
        px1, py1 = px2, py2
    return inside


def relabel_intrusions(
    result: dict, roi_polys: List[List[Tuple[int, int]]], frame_wh: Tuple[int, int]
) -> dict:
    """Relabel detections: if a person center lies inside any ROI polygon mark as 'intrusion'.

    If roi_polys is empty, treat full frame as ROI.
    """
    try:
        if not isinstance(result, dict):
            return result
        detections = result.get("detection", [])
        W, H = frame_wh
        effective_polys = (
            roi_polys[:] if roi_polys else [[(0, 0), (W, 0), (W, H), (0, H)]]
        )
        for det in detections:
            loc = det.get("location", [0, 0, 0, 0])
            x1, y1, x2, y2 = [int(v) for v in loc]
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            for poly in effective_polys:
                if _point_in_polygon(cx, cy, poly):
                    det["label"] = "intrusion"
                    break
        return result
    except Exception as e:
        cfg.logger.error("Error in relabel_intrusions: %s", e)
        return result


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

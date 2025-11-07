import os
import my_utils as mu
import config as cfg
import requests
from model_init import get_model_device, load_model_from_path
from datetime import datetime, timezone, timedelta
import json
import time
import cv2
import numpy as np
from typing import Dict, Tuple, Optional
from tracking.deep_sort_pytorch.deep_sort.deep_sort import DeepSort
from tracking.trackbleobject import TrackableObject

# ===================== Model (Head detection) =====================
PERSON_WEIGHT_PATH = "pt_model/crowdhuman_yolov5m.pt"
PERSON_MODEL = load_model_from_path(PERSON_WEIGHT_PATH)

DEVICE = get_model_device()

frame_status_url = cfg.FRAME_STATUS_URL
get_frame_url = cfg.GET_FRAME_URL
COPY_IMAGES_URL = cfg.COPY_IMAGES_URL
DELETE_SOURCE_IMAGE_URL = cfg.DELETE_SOURCE_IMAGE_URL
PEOPLE_COUNTS_API_URL = cfg.PEOPLE_COUNTS_API_URL

# ==================================================================================
# Optional visualization toggle: set to True to save detection overlays
VISUALIZE_OUTPUTS = False
# ==================================================================================


def set_response_schema(current_time: datetime, frame_status: str, camera_id: int):
    """Report per-frame processing status for People In/Out to backend."""
    payload = {
        "camera_id": camera_id,
        "frame_time": str(current_time),
        "camera_status": {
            "people_inout": frame_status.upper(),
        },
    }
    cfg.logger.debug(
        "Posting frame status | url=%s payload=%s", frame_status_url, payload
    )
    requests.post(frame_status_url, json=payload)


# ===================== Tracking state (persisted per camera) =====================
_deepsort_map: Dict[int, DeepSort] = {}
_trackable_map: Dict[int, Dict[int, TrackableObject]] = {}


def get_deepsort_for_camera(cam_id: int) -> DeepSort:
    """Create or return a DeepSort instance for a camera."""
    if cam_id not in _deepsort_map:
        cfg.logger.info("Initializing DeepSort for camera_id=%s", cam_id)
        _deepsort_map[cam_id] = DeepSort(
            cfg.REID_CKPT,
            max_dist=cfg.MAX_DIST,
            min_confidence=cfg.MIN_CONFIDENCE,
            nms_max_overlap=cfg.NMS_MAX_OVERLAP,
            max_iou_distance=cfg.MAX_IOU_DISTANCE,
            max_age=cfg.MAX_AGE,
            n_init=cfg.N_INIT,
            nn_budget=cfg.NN_BUDGET,
            use_cuda=True,
        )
    if cam_id not in _trackable_map:
        _trackable_map[cam_id] = {}
    return _deepsort_map[cam_id]


def line_side(p1: Tuple[int, int], p2: Tuple[int, int], pt: Tuple[float, float]) -> float:
    """Return signed distance proxy to decide which side of the line (p1->p2) a point lies.
    Positive/negative sign can be used to detect crossings.
    """
    return (pt[0] - p1[0]) * (p2[1] - p1[1]) - (pt[1] - p1[1]) * (p2[0] - p1[0])


def is_horizontal_line(p1: Tuple[int, int], p2: Tuple[int, int]) -> bool:
    return abs(p1[1] - p2[1]) <= 2


if __name__ == "__main__":
    cfg.logger.info("People In/Out service starting up")
    cfg.logger.info("Model weights: %s | Device: %s", PERSON_WEIGHT_PATH, DEVICE)
    while True:
        try:
            start_cycle_ts = time.time()
            camera_list = mu.get_all_camera()
            cfg.logger.info(f"camera_list :: {camera_list}")

            for camera in camera_list:
                camera_id = int(camera["id"])
                cfg.logger.info(f"Running People In/Out on camera_id :: {camera_id}")
                cam_start_ts = time.time()

                # Geometry from config
                line_cfg = cfg.PEOPLE_LINE_CONFIG.get(camera_id)
                roi_cfg = cfg.PEOPLE_ROI_CONFIG.get(camera_id)
                if not line_cfg or "p1" not in line_cfg or "p2" not in line_cfg:
                    cfg.logger.warning(
                        "No line config for camera_id=%s. Skipping this camera.", camera_id
                    )
                    continue
                p1 = tuple(map(int, line_cfg["p1"]))
                p2 = tuple(map(int, line_cfg["p2"]))
                roi_box = None
                if roi_cfg and "roi" in roi_cfg:
                    rb = roi_cfg["roi"]
                    if isinstance(rb, (list, tuple)) and len(rb) == 4:
                        roi_box = list(map(int, rb))

                # Use current UTC time minus 1 minute for frame fetching
                dt_utc_minus_1 = datetime.now(timezone.utc) - timedelta(minutes=1)
                # legacy minute bucket string for status
                current_time = dt_utc_minus_1.strftime("%Y-%m-%d %H:%M:00")
                # ISO timestamp for counts API
                frame_time_iso = dt_utc_minus_1.replace(second=0, microsecond=0).isoformat().replace("+00:00", "Z")
                params = {
                    "frame_time": current_time,  # Replace with the desired datetime
                    "camera_id": int(camera_id),
                }
                cfg.logger.info(
                    f"Fetching frame | url={get_frame_url} params={params}"
                )
                t_get_start = time.time()
                response = requests.get(get_frame_url, params=params)
                t_get_end = time.time()
                cfg.perf_logger.info(
                    "get_frame latency_ms=%.2f camera_id=%s",
                    (t_get_end - t_get_start) * 1000,
                    camera_id,
                )

                if response.status_code == 200:
                    cfg.logger.info(f"Frame API Response :: {response.status_code}")

                else:
                    cfg.logger.error(
                        f"Error: {response.status_code}, {response.text}"
                    )

                set_response_schema(
                    current_time=current_time,
                    frame_status="started",
                    camera_id=int(camera_id),
                )
                response = response.json()
                image_path = response.get("frame_data")
                main_image_path = image_path
                cfg.logger.info(f"Image get from api :: {image_path}")

                if image_path:
                    cfg.logger.debug(f"cfg.ROOT_PATH :: {cfg.ROOT_PATH}")
                    cfg.logger.debug(f"cfg.ROOT_URL :: {cfg.ROOT_URL}")
                    # Normalize ROOT_URL to avoid double slashes like http://ip//frames/...
                    base_url = (cfg.ROOT_URL or "").rstrip("/")
                    image_path_url = image_path.replace(cfg.ROOT_PATH, base_url)
                    cfg.logger.debug(
                        f"Converted image_path_url (normalized): {image_path_url}"
                    )

                    camera_id = int(image_path.split("/")[-2])
                    cfg.logger.info(f"Proceeding with Camera ID :: {camera_id} ")

                    set_response_schema(
                        current_time=current_time,
                        frame_status="processing",
                        camera_id=int(camera_id),
                    )

                    cfg.logger.info(f"Proceeding with Image Size :: {cfg.IMAGE_SIZE} ")
                    t_load_start = time.time()
                    load_result = mu.load_image_from_url(
                        image_path_url, int(cfg.IMAGE_SIZE)
                    )
                    t_load_end = time.time()
                    cfg.perf_logger.info(
                        "load_image latency_ms=%.2f camera_id=%s path=%s",
                        (t_load_end - t_load_start) * 1000,
                        camera_id,
                        image_path_url,
                    )

                    # Handle failures from load_image_from_url (e.g., HTTP 404)
                    if not load_result or load_result is False:
                        cfg.logger.warning(
                            "Image fetch failed over HTTP for URL: %s. Attempting local disk path: %s",
                            image_path_url,
                            main_image_path,
                        )
                        disk_result = mu.load_image_from_disk(
                            main_image_path, int(cfg.IMAGE_SIZE)
                        )
                        if not disk_result or disk_result is False:
                            cfg.logger.error(
                                "Image fetch failed from both HTTP and disk. Skipping this frame. url=%s path=%s",
                                image_path_url,
                                main_image_path,
                            )
                            set_response_schema(
                                current_time=current_time,
                                frame_status="failed",
                                camera_id=int(camera_id),
                            )
                            continue
                        else:
                            img, img0, image_path = disk_result
                    else:
                        img, img0, image_path = load_result

                    # Run head detection
                    t_inf_start = time.time()
                    result, det_tensor, names = mu.predict_raw(
                        PERSON_MODEL,
                        img,
                        img0,
                        DEVICE,
                        float(cfg.MODEL_CONF),
                        float(cfg.MODEL_IOU),
                        target_label="head",
                    )
                    t_inf_end = time.time()
                    cfg.perf_logger.info(
                        "inference latency_ms=%.2f camera_id=%s detections=%s",
                        (t_inf_end - t_inf_start) * 1000,
                        camera_id,
                        len(result.get("detection", [])),
                    )

                    cfg.logger.info(f"Result of Head Model::{result}")

                    # ROI filtering (limit to gate region)
                    if roi_box:
                        before_roi = len(result.get("detection", []))
                        # filter formatted list by center-in-ROI
                        result["detection"] = mu.filter_detections_by_rois(
                            result.get("detection", []), [roi_box]
                        )
                        after_roi = len(result.get("detection", []))
                        cfg.logger.info(
                            "Filtered detections by ROI | before=%s after=%s roi=%s",
                            before_roi,
                            after_roi,
                            roi_box,
                        )
                        # also filter raw tensor by ROI
                        if det_tensor is not None and len(det_tensor) > 0:
                            kept = []
                            x1r, y1r, x2r, y2r = roi_box
                            for row in det_tensor:
                                x1, y1, x2, y2, conf, cls = row.tolist()
                                cx = (x1 + x2) / 2.0
                                cy = (y1 + y2) / 2.0
                                if x1r <= cx <= x2r and y1r <= cy <= y2r:
                                    kept.append(row)
                            det_tensor = det_tensor.new_tensor(kept) if kept else None

                    # ===================== Tracking and counting =====================
                    in_count = 0
                    out_count = 0
                    if det_tensor is not None and len(det_tensor) > 0:
                        xywh_bboxs = []
                        confs = []
                        for *xyxy, conf, cls in det_tensor:
                            x1, y1, x2, y2 = [v.item() for v in xyxy]
                            x_c = (x1 + x2) / 2.0
                            y_c = (y1 + y2) / 2.0
                            w = abs(x2 - x1)
                            h = abs(y2 - y1)
                            xywh_bboxs.append([x_c, y_c, w, h])
                            confs.append([float(conf.item())])

                        xywhs = None
                        confss = None
                        if len(xywh_bboxs) > 0:
                            import torch

                            xywhs = torch.Tensor(xywh_bboxs)
                            confss = torch.Tensor(confs)

                        deepsort = get_deepsort_for_camera(camera_id)
                        outputs = (
                            deepsort.update(xywhs, confss, img0)
                            if xywhs is not None
                            else []
                        )

                        trackables = _trackable_map[camera_id]
                        if len(outputs) > 0:
                            horiz = is_horizontal_line(p1, p2)
                            line_y = p1[1]
                            for cord in outputs:
                                x1o, y1o, x2o, y2o, tid = cord.tolist()
                                cx = (x1o + x2o) / 2.0
                                cy = (y1o + y2o) / 2.0
                                to = trackables.get(tid)
                                if to is None:
                                    to = TrackableObject(tid, (cx, cy))
                                else:
                                    # Movement
                                    prev = to.centroids[-1]
                                    to.centroids.append((cx, cy))
                                    crossed = False
                                    if horiz:
                                        # bottom->top IN ; top->bottom OUT
                                        prev_side = prev[1] - line_y
                                        curr_side = cy - line_y
                                        if not to.counted and prev_side > 0 >= curr_side:
                                            in_count += 1
                                            to.counted = True
                                            crossed = True
                                        elif not to.counted and prev_side < 0 <= curr_side:
                                            out_count += 1
                                            to.counted = True
                                            crossed = True
                                    else:
                                        # general crossing using line_side sign
                                        prev_s = line_side(p1, p2, prev)
                                        curr_s = line_side(p1, p2, (cx, cy))
                                        if not to.counted and prev_s * curr_s <= 0:
                                            # Heuristic for IN/OUT using vertical orientation
                                            if cy < prev[1]:
                                                in_count += 1
                                            else:
                                                out_count += 1
                                            to.counted = True
                                            crossed = True
                                    if crossed:
                                        cfg.logger.info(
                                            "Track %s crossed line at (%d,%d)-(%d,%d): IN=%d OUT=%d",
                                            tid,
                                            p1[0],
                                            p1[1],
                                            p2[0],
                                            p2[1],
                                            in_count,
                                            out_count,
                                        )
                                trackables[tid] = to
                        else:
                            deepsort.increment_ages()

                    # ===================== Visualization =====================
                    if VISUALIZE_OUTPUTS:
                        try:
                            vis = img0.copy()
                            # draw ROI
                            if roi_box:
                                x1r, y1r, x2r, y2r = roi_box
                                cv2.rectangle(vis, (x1r, y1r), (x2r, y2r), (0, 255, 255), 2)
                            # draw line
                            cv2.line(vis, p1, p2, (0, 0, 255), 2)
                            # draw boxes
                            for det in result.get("detection", []):
                                x1, y1, x2, y2 = det.get("location", [0, 0, 0, 0])
                                cv2.rectangle(vis, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
                            # overlay counts
                            cv2.putText(
                                vis,
                                f"IN: {in_count} OUT: {out_count}",
                                (20, 30),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                1.0,
                                (255, 255, 255),
                                2,
                                cv2.LINE_AA,
                            )
                            os.makedirs("people_inout_outputs", exist_ok=True)
                            out_name = image_path_url.split("/")[-1]
                            out_path = os.path.join("people_inout_outputs", out_name)
                            cv2.imwrite(out_path, vis)
                            cfg.logger.info("Saved visualization image: %s", out_path)
                        except Exception as e:
                            cfg.logger.warning("Failed to generate visualization: %s", e)

                    # ===================== Persist counts to API =====================
                    if in_count > 0 or out_count > 0:
                        # Post two records: one for IN and one for OUT, as counts are separate by frame_analysis
                        for label, cnt in (("IN", in_count), ("OUT", out_count)):
                            if cnt <= 0:
                                continue
                            payload = {
                                "frame_time": frame_time_iso,
                                "frame_analysis": label,
                                "frame_count": int(cnt),
                                "camera_id": int(camera_id),
                                "user_id": int(cfg.USER_ID) if str(cfg.USER_ID).isdigit() else cfg.USER_ID,
                                "location_id": int(cfg.LOCATION_ID) if str(cfg.LOCATION_ID).isdigit() else cfg.LOCATION_ID,
                                "usecase_id": int(cfg.USECASE_ID) if str(cfg.USECASE_ID).isdigit() else cfg.USECASE_ID,
                            }
                            cfg.logger.info("Posting counts | url=%s payload=%s", PEOPLE_COUNTS_API_URL, payload)
                            t_post_s = time.time()
                            try:
                                resp = requests.post(PEOPLE_COUNTS_API_URL, json=payload, timeout=5)
                                t_post_e = time.time()
                                cfg.perf_logger.info(
                                    "counts_post latency_ms=%.2f camera_id=%s status=%s",
                                    (t_post_e - t_post_s) * 1000,
                                    camera_id,
                                    getattr(resp, "status_code", -1),
                                )
                                if resp.status_code != 200:
                                    cfg.logger.error("Counts API failed | status=%s body=%s", resp.status_code, getattr(resp, "text", ""))
                            except Exception as e:
                                cfg.logger.error("Counts API exception: %s", e)

                    set_response_schema(
                        current_time=current_time,
                        frame_status="completed",
                        camera_id=int(camera_id),
                    )

                    # Call API to delete source image after processing
                    delete_params = {"image_source_url": image_path_url}
                    cfg.logger.info(
                        f"Calling DELETE_SOURCE_IMAGE_URL API with: {delete_params}"
                    )
                    cfg.logger.debug(f"Delete API :: {DELETE_SOURCE_IMAGE_URL}")

                    t_del_start = time.time()
                    try:
                        delete_response = requests.delete(
                            DELETE_SOURCE_IMAGE_URL, params=delete_params, timeout=5
                        )
                        t_del_end = time.time()
                        cfg.perf_logger.info(
                            "delete_image latency_ms=%.2f camera_id=%s status=%s",
                            (t_del_end - t_del_start) * 1000,
                            camera_id,
                            getattr(delete_response, "status_code", -1),
                        )
                        cfg.logger.info(
                            "Source image delete response | status=%s url=%s path=%s",
                            getattr(delete_response, "status_code", -1),
                            image_path_url,
                            main_image_path,
                        )
                    except Exception as e:
                        cfg.logger.error("Delete API exception: %s", e)

                cfg.logger.info(
                    "AI Processing Ended - **************************************************"
                )
                cfg.perf_logger.info(
                    "camera_cycle_total_ms=%.2f camera_id=%s",
                    (time.time() - cam_start_ts) * 1000,
                    camera_id,
                )
            cfg.logger.info(f"Sleeping for {cfg.SLEEP_TIME} Seconds")
            cfg.perf_logger.info(
                "iteration_total_ms=%.2f", (time.time() - start_cycle_ts) * 1000
            )
            time.sleep(cfg.SLEEP_TIME)

        except Exception as e:
            cfg.logger.exception("Unhandled exception in main loop: %s", e)

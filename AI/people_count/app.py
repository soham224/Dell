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
# Optional visualization toggle and output path come from config
# - Enable by exporting VISUALIZE=1 (or true/yes/on)
# - Output directory defaults to PWD/outputs but can be overridden via OUTPUTS_DIR
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
            # Determine usecase_id once per iteration
            try:
                usecase_id_main = int(cfg.USECASE_ID) if str(cfg.USECASE_ID).isdigit() else cfg.USECASE_ID
            except Exception:
                usecase_id_main = cfg.USECASE_ID
            # Consider only cameras which have an active mapping for this usecase
            camera_list = mu.get_cameras_for_usecase(usecase_id_main)
            cfg.logger.info(f"camera_list (usecase={usecase_id_main}) :: {camera_list}")

            for camera in camera_list:
                camera_id = int(camera["id"])
                cfg.logger.info(f"Running People In/Out on camera_id :: {camera_id}")
                cam_start_ts = time.time()

                # Fetch ROI and line from DB mapping
                # Use same resolved usecase_id for mapping fetch
                usecase_id = usecase_id_main
                people_cfg = mu.get_people_config(camera_id=camera_id, usecase_id=usecase_id)
                roi_box = people_cfg.get("roi_box")
                line_cfg = people_cfg.get("line")
                # Log raw ROI configurations fetched from DB
                cfg.logger.info(
                    "DB ROI config | camera_id=%s usecase_id=%s | roi_box=%s | line=%s",
                    camera_id,
                    usecase_id,
                    roi_box,
                    line_cfg,
                )
                if not line_cfg or "p1" not in line_cfg or "p2" not in line_cfg:
                    cfg.logger.warning(
                        "No line mapping in DB for camera_id=%s. Skipping this camera.", camera_id
                    )
                    continue
                p1 = tuple(map(int, line_cfg["p1"]))
                p2 = tuple(map(int, line_cfg["p2"]))
                # Log resolved ROI values (parsed to integers)
                try:
                    if isinstance(roi_box, (list, tuple)) and len(roi_box) == 4:
                        x1r, y1r, x2r, y2r = [int(v) for v in roi_box]
                        cfg.logger.info(
                            "Resolved ROI | roi_box=[x1=%d,y1=%d,x2=%d,y2=%d] | line p1=(%d,%d) p2=(%d,%d)",
                            x1r,
                            y1r,
                            x2r,
                            y2r,
                            p1[0],
                            p1[1],
                            p2[0],
                            p2[1],
                        )
                    else:
                        cfg.logger.info(
                            "Resolved ROI | roi_box=%s | line p1=(%d,%d) p2=(%d,%d)",
                            roi_box,
                            p1[0],
                            p1[1],
                            p2[0],
                            p2[1],
                        )
                except Exception as e:
                    cfg.logger.warning("Failed logging resolved ROI/line: %s", e)

                # Use current UTC time minus 1 minute for frame fetching
                dt_utc_minus_1 = datetime.now(timezone.utc) - timedelta(minutes=1)
                # Include seconds in frame_time for precise retrieval
                current_time = dt_utc_minus_1.strftime("%Y-%m-%d %H:%M:%S")
                # ISO timestamp for counts API (preserve seconds)
                frame_time_iso = dt_utc_minus_1.replace(microsecond=0).isoformat().replace("+00:00", "Z")
                params = {
                    "frame_time": current_time,  # Replace with the desired datetime
                    "camera_id": int(camera_id),
                }
                cfg.logger.info(
                    f"Fetching frame | url={get_frame_url} params={params}"
                )
                t_get_start = time.time()
                try:
                    response = requests.get(get_frame_url, params=params, timeout=5)
                    t_get_end = time.time()
                    cfg.perf_logger.info(
                        "get_frame latency_ms=%.2f camera_id=%s",
                        (t_get_end - t_get_start) * 1000,
                        camera_id,
                    )
                except requests.exceptions.ConnectionError as e:
                    cfg.logger.error(
                        "Connection refused while fetching frame | url=%s params=%s error=%s",
                        get_frame_url,
                        params,
                        e,
                    )
                    set_response_schema(
                        current_time=current_time,
                        frame_status="failed",
                        camera_id=int(camera_id),
                    )
                    cfg.logger.info(f"Sleeping for {cfg.SLEEP_TIME} Seconds due to connection error")
                    time.sleep(cfg.SLEEP_TIME)
                    continue
                except Exception as e:
                    cfg.logger.error("Unhandled exception during frame fetch: %s", e)
                    set_response_schema(
                        current_time=current_time,
                        frame_status="failed",
                        camera_id=int(camera_id),
                    )
                    continue

                if response.status_code == 200:
                    cfg.logger.info(f"Frame API Response :: {response.status_code}")
                elif response.status_code == 404:
                    # Frame not available for the requested frame_time
                    cfg.logger.warning(
                        "Frame data not found (404) for frame_time=%s camera_id=%s. Sleeping for %s seconds.",
                        current_time,
                        camera_id,
                        cfg.SLEEP_TIME,
                    )
                    # Do not mark as failed; just wait and try in the next loop
                    time.sleep(cfg.SLEEP_TIME)
                    continue
                else:
                    cfg.logger.error(
                        f"Error: {response.status_code}, {response.text}"
                    )
                    set_response_schema(
                        current_time=current_time,
                        frame_status="failed",
                        camera_id=int(camera_id),
                    )
                    continue

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
                    # If ROI is missing, use full frame as ROI
                    if not roi_box:
                        h, w = img0.shape[:2]
                        roi_box = [0, 0, int(w - 1), int(h - 1)]
                        cfg.logger.warning(
                            "No ROI found in DB for camera_id=%s; defaulting to full frame ROI=%s",
                            camera_id,
                            roi_box,
                        )
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
                    if cfg.VISUALIZE:
                        try:
                            vis = img0.copy()
                            # Draw ROI box if present (yellow)
                            if roi_box:
                                x1r, y1r, x2r, y2r = roi_box
                                cv2.rectangle(vis, (x1r, y1r), (x2r, y2r), (0, 255, 255), 2)
                                cv2.putText(vis, "ROI", (x1r + 5, max(y1r - 8, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2, cv2.LINE_AA)
                            # Draw line (red)
                            if 'p1' in locals() and 'p2' in locals():
                                cv2.line(vis, p1, p2, (0, 0, 255), 2)
                                cv2.putText(vis, "LINE", (min(p1[0], p2[0]) + 5, max(min(p1[1], p2[1]) - 8, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2, cv2.LINE_AA)
                            # Draw detections (green) and ensure label shows 'head' when present/missing
                            for det in result.get("detection", []):
                                x1, y1, x2, y2 = [int(v) for v in det.get("location", [0, 0, 0, 0])]
                                cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
                                label_text = det.get("label") or "head"
                                cv2.putText(
                                    vis,
                                    label_text,
                                    (x1, max(y1 - 5, 12)),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.5,
                                    (0, 255, 0),
                                    2,
                                    cv2.LINE_AA,
                                )
                            # Draw tracking outputs (magenta) and trajectories (cyan)
                            try:
                                draw_outputs = outputs if 'outputs' in locals() else []
                            except Exception:
                                draw_outputs = []
                            if draw_outputs:
                                for x1o, y1o, x2o, y2o, tid in draw_outputs:
                                    x1o, y1o, x2o, y2o, tid = int(x1o), int(y1o), int(x2o), int(y2o), int(tid)
                                    cv2.rectangle(vis, (x1o, y1o), (x2o, y2o), (255, 0, 255), 2)
                                    cv2.putText(vis, f"ID:{tid}", (x1o, max(y1o - 5, 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2, cv2.LINE_AA)
                                    # draw trajectory if available
                                    to_map = _trackable_map.get(camera_id, {})
                                    to = to_map.get(tid)
                                    if to and getattr(to, 'centroids', None):
                                        pts = [(int(cx), int(cy)) for (cx, cy) in to.centroids[-30:]]  # last 30
                                        for i in range(1, len(pts)):
                                            cv2.line(vis, pts[i-1], pts[i], (255, 255, 0), 2)
                            # Overlay summary text aligned to top-right
                            summary = [
                                f"camera_id={camera_id}",
                                f"in={in_count} out={out_count}",
                                f"detections={len(result.get('detection', []))}",
                            ]
                            y0 = 30
                            margin = 20
                            h_vis, w_vis = vis.shape[:2]
                            for idx, line in enumerate(summary):
                                (tw, th), _ = cv2.getTextSize(line, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
                                x_right = w_vis - margin - tw
                                y = y0 + idx * 22
                                cv2.putText(
                                    vis,
                                    line,
                                    (x_right, y),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.7,
                                    (255, 255, 255),
                                    2,
                                    cv2.LINE_AA,
                                )
                            # Ensure outputs directory
                            os.makedirs(cfg.OUTPUTS_DIR, exist_ok=True)
                            out_name = image_path_url.split("/")[-1]
                            out_path = os.path.join(cfg.OUTPUTS_DIR, out_name)
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
                            # Fetch location_id for this camera from DB
                            loc_id = mu.get_location_id_by_camera_id(camera_id) or 0
                            payload = {
                                "frame_time": frame_time_iso,
                                "frame_analysis": label,
                                "frame_count": int(cnt),
                                "camera_id": int(camera_id),
                                "user_id": int(cfg.USER_ID) if str(cfg.USER_ID).isdigit() else cfg.USER_ID,
                                "location_id": int(loc_id),
                                "usecase_id": int(usecase_id) if str(usecase_id).isdigit() else usecase_id,
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
            # cfg.logger.info(f"Sleeping for {cfg.SLEEP_TIME} Seconds")
            cfg.perf_logger.info(
                "iteration_total_ms=%.2f", (time.time() - start_cycle_ts) * 1000
            )
            # time.sleep(cfg.SLEEP_TIME)

        except Exception as e:
            cfg.logger.exception("Unhandled exception in main loop: %s", e)

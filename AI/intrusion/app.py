import os
import my_utils as mu
import config as cfg
import requests
from model_init import get_model_device, load_model_from_path
from datetime import datetime, timezone, timedelta
import json
import time
import cv2

PERSON_WEIGHT_PATH = cfg.PERSON_WEIGHT_PATH
PERSON_MODEL = load_model_from_path(PERSON_WEIGHT_PATH)

DEVICE = get_model_device()

frame_status_url = cfg.FRAME_STATUS_URL
get_frame_url = cfg.GET_FRAME_URL
COPY_IMAGES_URL = cfg.COPY_IMAGES_URL
DELETE_SOURCE_IMAGE_URL = cfg.DELETE_SOURCE_IMAGE_URL

# ==================================================================================
# Optional visualization toggle: set to True to save detection overlays
# You can also comment out the entire block below where this flag is used
VISUALIZE_OUTPUTS = False
# ==================================================================================


def set_response_schema(current_time: datetime, frame_status: str, camera_id: int):
    """Report per-frame processing status for intrusion detection to backend."""
    payload = {
        "camera_id": camera_id,
        "frame_time": str(current_time),
        "camera_status": {
            "intrusion_detection": frame_status.upper(),
        },
    }
    cfg.logger.debug(
        "Posting frame status | url=%s payload=%s", frame_status_url, payload
    )
    requests.post(frame_status_url, json=payload)


def _build_image_url(local_path: str) -> str:
    """Convert absolute local path to HTTP URL using ROOT_URL/ROOT_PATH without double slashes.

    Example: ROOT_PATH=/frames/dell, ROOT_URL=http://host ->
    local_path=/frames/dell/events/2/a.jpg => http://host/events/2/a.jpg
    """
    try:
        root_path = (cfg.ROOT_PATH or "").rstrip("/")
        root_url = (cfg.ROOT_URL or "").rstrip("/")
        if root_path and local_path.startswith(root_path):
            suffix = local_path[len(root_path) :]  # keeps leading '/'
            return f"{root_url}{suffix}"
        # Fallback to prior behavior but normalize any double slashes after scheme
        candidate = local_path.replace(cfg.ROOT_PATH, cfg.ROOT_URL)
        # Normalize 'http://host//path' -> 'http://host/path'
        if candidate.startswith("http://") or candidate.startswith("https://"):
            scheme_split = candidate.split("://", 1)
            host_and_path = scheme_split[1].lstrip("/")
            # ensure single slash between host and path
            parts = host_and_path.split("/", 1)
            host = parts[0]
            rest = "/" + parts[1] if len(parts) > 1 else ""
            return f"{scheme_split[0]}://{host}{rest}"
        return candidate
    except Exception:
        return local_path


if __name__ == "__main__":
    cfg.logger.info("Intrusion Detection service starting up")
    cfg.logger.info("Model weights: %s | Device: %s", PERSON_WEIGHT_PATH, DEVICE)
    while True:
        try:
            start_cycle_ts = time.time()
            camera_list = mu.get_all_camera()
            cfg.logger.info(f"camera_list :: {camera_list}")

            for camera in camera_list:
                camera_id = int(camera["id"])
                cfg.logger.info(f"Running AI on camera_id :: {camera_id}")
                cam_start_ts = time.time()

                cfg.logger.debug(f"Configured Result type id :: {cfg.RESULT_TYPE_ID}")
                roi_details = mu.get_roi_by_result_type_id_and_camera_rtsp_id(
                    cfg.RESULT_TYPE_ID, camera_id
                )
                cfg.logger.info(
                    f"ROI DETAILS for RESULT_TYPE_ID :: {cfg.RESULT_TYPE_ID} and camera_id :: {camera_id} are \n {roi_details}"
                )

                if roi_details:
                    roi_raw = (
                        roi_details.get("roi")
                        if isinstance(roi_details, dict)
                        else None
                    )
                    roi_list = []
                    if roi_raw:
                        try:
                            roi_list = json.loads(roi_raw)
                        except Exception as e:
                            cfg.logger.warning(
                                "Failed to parse ROI JSON; proceeding without ROI | error=%s roi_raw=%s",
                                e,
                                str(roi_raw)[:200],
                            )
                    cfg.logger.debug(
                        "Parsed ROI list (len=%d)",
                        len(roi_list) if isinstance(roi_list, list) else 0,
                    )
                    # Use current UTC time minus 1 minute for frame fetching
                    dt_utc_minus_1 = datetime.now(timezone.utc) - timedelta(minutes=1)
                    current_time = dt_utc_minus_1.strftime("%Y-%m-%d %H:%M:00")
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
                        image_path_url = _build_image_url(image_path)
                        cfg.logger.debug(f"Converted image_path_url: {image_path_url}")

                        camera_id = int(image_path.split("/")[-2])
                        cfg.logger.info(f"Proceeding with Camera ID :: {camera_id} ")

                        set_response_schema(
                            current_time=current_time,
                            frame_status="processing",
                            camera_id=int(camera_id),
                        )

                        cfg.logger.info(
                            f"Proceeding with Image Size :: {cfg.IMAGE_SIZE} "
                        )
                        t_load_start = time.time()
                        load_res = mu.load_image_from_url(
                            image_path_url, int(cfg.IMAGE_SIZE)
                        )
                        t_load_end = time.time()
                        cfg.perf_logger.info(
                            "load_image latency_ms=%.2f camera_id=%s path=%s",
                            (t_load_end - t_load_start) * 1000,
                            camera_id,
                            image_path_url,
                        )
                        if not load_res or load_res is False or not isinstance(load_res, tuple) or len(load_res) != 3:
                            cfg.logger.error(
                                "Failed to load image from URL (skipping). url=%s", image_path_url
                            )
                            # Mark as completed for this frame to avoid blocking downstream
                            set_response_schema(
                                current_time=current_time,
                                frame_status="completed",
                                camera_id=int(camera_id),
                            )
                            continue
                        img, img0, image_path = load_res

                        usecase = "intrusion_detection"

                        cfg.logger.info(f"Usecase Selected :: {usecase}")
                        cfg.logger.info("intrusion_detection usecase detected")

                        t_inf_start = time.time()
                        result = mu.predict(
                            PERSON_MODEL,
                            img,
                            img0,
                            DEVICE,
                            float(cfg.MODEL_CONF),
                            float(cfg.MODEL_IOU),
                            usecase,
                            str(camera_id),
                        )
                        t_inf_end = time.time()
                        cfg.perf_logger.info(
                            "inference latency_ms=%.2f camera_id=%s detections=%s",
                            (t_inf_end - t_inf_start) * 1000,
                            camera_id,
                            (
                                len(result.get("detection", []))
                                if isinstance(result, dict)
                                else -1
                            ),
                        )

                        cfg.logger.info(f"Raw detection result::{result}")

                        # Keep only person detections for intrusion logic
                        if isinstance(result, dict):
                            dets = result.get("detection", [])
                            before = len(dets)
                            result["detection"] = [
                                d for d in dets if d.get("label") == "person"
                            ]
                            after = len(result.get("detection", []))
                            cfg.logger.info(
                                "Filtered to person class | before=%s after=%s",
                                before,
                                after,
                            )

                        # Parse ROI polygons (empty -> full frame)
                        roi_polys = []
                        roi_raw = (
                            roi_details.get("roi")
                            if isinstance(roi_details, dict)
                            else None
                        )
                        if roi_raw:
                            roi_polys = mu._parse_roi_list(roi_raw)
                        # Relabel intrusions if center lies inside ROI
                        if isinstance(result, dict):
                            H, W = img0.shape[:2]
                            result = mu.relabel_intrusions(result, roi_polys, (W, H))
                            # Keep only intrusions; drop non-intrusion detections (i.e., outside ROI)
                            try:
                                dets = result.get("detection", [])
                                before = len(dets)
                                result["detection"] = [
                                    d for d in dets if d.get("label") == "intrusion"
                                ]
                                after = len(result.get("detection", []))
                                cfg.logger.info(
                                    "Filtered to intrusions post-ROI | before=%s after=%s",
                                    before,
                                    after,
                                )
                            except Exception as e:
                                cfg.logger.warning(
                                    "Failed to filter to intrusions after ROI relabel: %s", e
                                )

                        # If ROI(s) are provided, prepare an overlay image in memory. We'll write it
                        # to the destination (events) image after COPY succeeds, leaving source intact.
                        roi_overlay_img = None
                        try:
                            if roi_polys and isinstance(roi_polys, list) and len(roi_polys) > 0:
                                roi_overlay_img = img0.copy()
                                for poly in roi_polys:
                                    pts = [(int(x), int(y)) for x, y in poly]
                                    # Draw closed polygon for ROI
                                    for i in range(len(pts)):
                                        cv2.line(
                                            roi_overlay_img,
                                            pts[i],
                                            pts[(i + 1) % len(pts)],
                                            (255, 0, 0), 2,
                                        )
                                    # Mark the ROI text near the first vertex
                                    cv2.putText(
                                        roi_overlay_img,
                                        "Intrusion ROI",
                                        pts[0],
                                        cv2.FONT_HERSHEY_SIMPLEX,
                                        0.7,
                                        (255, 0, 0),
                                        2,
                                        cv2.LINE_AA,
                                    )
                        except Exception as e:
                            cfg.logger.warning("Failed to generate ROI overlay: %s", e)

                        # ==================================================================================
                        # Optional visualization block (can be commented out)
                        if (
                            VISUALIZE_OUTPUTS
                            and result
                            and result.get("detection") is not None
                        ):
                            try:
                                vis_img = img0.copy()
                                # Draw ROI polygons
                                if roi_polys:
                                    for poly in roi_polys:
                                        pts = [(int(x), int(y)) for x, y in poly]
                                        for i in range(len(pts)):
                                            cv2.line(
                                                vis_img,
                                                pts[i],
                                                pts[(i + 1) % len(pts)],
                                                (255, 0, 0),
                                                2,
                                            )
                                        cv2.putText(
                                            vis_img,
                                            "Intrusion ROI",
                                            pts[0],
                                            cv2.FONT_HERSHEY_SIMPLEX,
                                            0.6,
                                            (255, 0, 0),
                                            2,
                                            cv2.LINE_AA,
                                        )
                                else:
                                    # indicate full-frame ROI
                                    cv2.rectangle(
                                        vis_img,
                                        (0, 0),
                                        (vis_img.shape[1] - 1, vis_img.shape[0] - 1),
                                        (255, 0, 0),
                                        2,
                                    )
                                    cv2.putText(
                                        vis_img,
                                        "ROI(full)",
                                        (10, 25),
                                        cv2.FONT_HERSHEY_SIMPLEX,
                                        0.7,
                                        (255, 0, 0),
                                        2,
                                        cv2.LINE_AA,
                                    )
                                # Draw detections: highlight intrusions
                                for det in result.get("detection", []):
                                    x1, y1, x2, y2 = det.get("location", [0, 0, 0, 0])
                                    label = det.get("label", "")
                                    color = (0,0,255) if label == "intrusion" else (0,255,0)
                                    cv2.rectangle(
                                        vis_img,
                                        (int(x1), int(y1)),
                                        (int(x2), int(y2)),
                                        color,
                                        2,
                                    )
                                    cv2.putText(
                                        vis_img,
                                        str(label),
                                        (int(x1), max(0, int(y1) - 5)),
                                        cv2.FONT_HERSHEY_SIMPLEX,
                                        0.6,
                                        color,
                                        2,
                                        cv2.LINE_AA,
                                    )

                                # Resize to 640x640 for output visualization
                                vis_img = cv2.resize(vis_img, (640, 640))

                                os.makedirs("intrusion_outputs", exist_ok=True)
                                out_name = image_path_url.split("/")[-1]
                                out_path = os.path.join("intrusion_outputs", out_name)
                                cv2.imwrite(out_path, vis_img)
                                cfg.logger.info(
                                    "Saved visualization image: %s", out_path
                                )
                            except Exception as e:
                                cfg.logger.warning(
                                    "Failed to generate visualization: %s", e
                                )
                        # ==================================================================================

                        # Proceed only if we have at least one detection (person or intrusion)
                        if result and result.get("detection"):
                            params = {
                                "image_source_url": image_path_url,
                                "image_des_url": image_path_url.replace(
                                    "raw_frames", "events"
                                ),
                                "image_size": cfg.IMAGE_SIZE,
                            }
                            cfg.logger.info(f"copy output image :: {params}")

                            t_copy_start = time.time()
                            response = requests.post(COPY_IMAGES_URL, params=params)
                            t_copy_end = time.time()
                            cfg.perf_logger.info(
                                "copy_image latency_ms=%.2f camera_id=%s status=%s",
                                (t_copy_end - t_copy_start) * 1000,
                                camera_id,
                                response.status_code,
                            )

                            if response.status_code == 200:
                                cfg.logger.info(
                                    "Copy API succeeded, persisting results to backend DB"
                                )
                                # If we have an ROI overlay image prepared, write it to destination
                                # file path so the saved (events) image contains the ROI outline.
                                try:
                                    if roi_overlay_img is not None:
                                        dest_local_path = main_image_path.replace("raw_frames", "events")
                                        cv2.imwrite(dest_local_path, roi_overlay_img)
                                        cfg.logger.info(
                                            "ROI overlay written to destination image: %s", dest_local_path
                                        )
                                except Exception as e:
                                    cfg.logger.warning(
                                        "Failed to write ROI overlay to destination image: %s", e
                                    )
                                mu.store_result(
                                    file_name=image_path_url.split("/")[-1],
                                    file_path=os.path.dirname(
                                        main_image_path.replace("raw_frames", "events")
                                    ),
                                    file_url=image_path_url.replace(
                                        "raw_frames", "events"
                                    ),
                                    bounding_box=result,
                                    frame_time=current_time,
                                    camera_id=int(camera_id),
                                )

                                cfg.logger.debug(
                                    f"Result Added into database successfully ...."
                                )
                            else:
                                cfg.logger.error(
                                    "Copy API failed | status=%s body=%s",
                                    response.status_code,
                                    getattr(response, "text", ""),
                                )
                        else:
                            cfg.logger.info(
                                "No detections after label filtering; skipping copy/store for camera_id=%s",
                                camera_id,
                            )

                        set_response_schema(
                            current_time=current_time,
                            frame_status="completed",
                            camera_id=int(camera_id),
                        )

                        # # Call API to delete source image after processing
                        # delete_params = {"image_source_url": image_path_url}
                        # cfg.logger.info(
                        #     f"Calling DELETE_SOURCE_IMAGE_URL API with: {delete_params}"
                        # )
                        # cfg.logger.debug(f"Delete API :: {DELETE_SOURCE_IMAGE_URL}")
                        #
                        # t_del_start = time.time()
                        # delete_response = requests.delete(
                        #     DELETE_SOURCE_IMAGE_URL, params=delete_params
                        # )
                        # t_del_end = time.time()
                        # cfg.perf_logger.info(
                        #     "delete_image latency_ms=%.2f camera_id=%s status=%s",
                        #     (t_del_end - t_del_start) * 1000,
                        #     camera_id,
                        #     delete_response.status_code,
                        # )
                        # cfg.logger.info(
                        #     f"Source image deleted successfully: {delete_response.status_code}"
                        # )

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

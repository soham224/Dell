import os
import my_utils as mu
import config as cfg
import requests
from model_init import get_model_device, load_model_from_path
from datetime import datetime, timezone, timedelta
import json
import time
import cv2

PERSON_WEIGHT_PATH = "pt_model/ppe-kit-detection-2.pt"
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
    """Report per-frame processing status for PPE detection to backend.

    The API contract expects a status object keyed by the use case name. We now
    use "ppe_detection" instead of the previous "crowd_detection".
    """
    payload = {
        "camera_id": camera_id,
        "frame_time": str(current_time),
        "camera_status": {
            "ppe_detection": frame_status.upper(),
        },
    }
    cfg.logger.debug(
        "Posting frame status | url=%s payload=%s", frame_status_url, payload
    )
    requests.post(frame_status_url, json=payload)


if __name__ == "__main__":
    cfg.logger.info("PPE Detection service starting up")
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

                # Parse ROI boxes if available (supports formats like {"location": [[x1,y1,x2,y2], ...]})
                roi_boxes = []
                if roi_details:
                    roi_raw = (
                        roi_details.get("roi") if isinstance(roi_details, dict) else None
                    )
                    roi_boxes = mu.parse_roi_boxes(roi_raw)
                    cfg.logger.debug("Parsed ROI boxes count=%d", len(roi_boxes))
                    # Use current UTC time minus 1 minute for frame fetching
                    dt_utc_minus_1 = datetime.now(timezone.utc) - timedelta(minutes=1)
                    current_time = dt_utc_minus_1.strftime("%Y-%m-%d %H:%M:%S")
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

                        cfg.logger.info(
                            f"Proceeding with Image Size :: {cfg.IMAGE_SIZE} "
                        )
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

                        usecase = "ppe_detection"

                        cfg.logger.info(f"Usecase Selected :: {usecase}")
                        cfg.logger.info("ppe_detection usecase detected")

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

                        cfg.logger.info(f"Result of PPE Model::{result}")

                        # Filter detections based on allowed labels from ROI mapping (if provided)
                        allowed = None
                        try:
                            allowed = (
                                roi_details.get("allowed_labels")
                                if isinstance(roi_details, dict)
                                else None
                            )
                        except Exception:
                            allowed = None

                        if allowed and isinstance(result, dict):
                            before = len(result.get("detection", []))
                            result["detection"] = [
                                d
                                for d in result.get("detection", [])
                                if d.get("label") in set(allowed)
                            ]
                            after = len(result.get("detection", []))
                            cfg.logger.info(
                                "Filtered detections by allowed labels | allowed=%s before=%s after=%s",
                                allowed,
                                before,
                                after,
                            )

                        # Filter detections to be inside provided ROI boxes (if any)
                        if roi_boxes and isinstance(result, dict):
                            before_roi = len(result.get("detection", []))
                            result["detection"] = mu.filter_detections_by_rois(
                                result.get("detection", []), roi_boxes
                            )
                            after_roi = len(result.get("detection", []))
                            cfg.logger.info(
                                "Filtered detections by ROI | before=%s after=%s rois=%s",
                                before_roi,
                                after_roi,
                                len(roi_boxes),
                            )

                        # ==================================================================================
                        # Optional visualization block (can be commented out)
                        if VISUALIZE_OUTPUTS and result and result.get("detection"):
                            try:
                                vis_img = img0.copy()
                                for det in result.get("detection", []):
                                    x1, y1, x2, y2 = det.get("location", [0, 0, 0, 0])
                                    label = det.get("label", "")
                                    color = (
                                        (0, 255, 0)
                                        if label in ("hardhat", "vest")
                                        else (0, 0, 255)
                                    )
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

                                os.makedirs("ppe_outputs", exist_ok=True)
                                out_name = image_path_url.split("/")[-1]
                                out_path = os.path.join("ppe_outputs", out_name)
                                cv2.imwrite(out_path, vis_img)
                                cfg.logger.info(
                                    "Saved visualization image: %s", out_path
                                )
                            except Exception as e:
                                cfg.logger.warning(
                                    "Failed to generate visualization: %s", e
                                )
                            # ==================================================================================

                        # If ROI provided, also draw ROI overlays on the original image and use it as copy source
                        overlay_source_url = None
                        if roi_boxes:
                            try:
                                over_img = img0.copy()
                                over_img = mu.draw_rois(over_img, roi_boxes)
                                # Save alongside the raw frame path with "_roi" suffix
                                src_dir = os.path.dirname(main_image_path)
                                src_base = os.path.basename(main_image_path)
                                name, ext = os.path.splitext(src_base)
                                overlay_filename = f"{name}_roi{ext or '.jpg'}"
                                overlay_disk_path = os.path.join(src_dir, overlay_filename)
                                # Only attempt to save overlay if the destination directory is writable on this host.
                                # This avoids permission errors when the raw frame path lives on a different machine
                                # (e.g., /home/dev1079) while this code runs on dev1034.
                                dest_dir = os.path.dirname(overlay_disk_path)
                                if os.path.isdir(dest_dir) and os.access(dest_dir, os.W_OK):
                                    saved_path = mu.save_overlay_image(over_img, overlay_disk_path)
                                    if saved_path:
                                        base_url = (cfg.ROOT_URL or "").rstrip("/")
                                        # Convert disk path to URL analogous to how raw frames are served
                                        overlay_source_url = saved_path.replace(cfg.ROOT_PATH, base_url)
                                        cfg.logger.info("Prepared ROI overlay source: %s", overlay_source_url)
                                    else:
                                        cfg.logger.info("Overlay save not available; will use raw source image")
                                else:
                                    cfg.logger.debug(
                                        "Skipping overlay save; non-writable or non-local path: %s",
                                        dest_dir,
                                    )
                            except Exception as e:
                                cfg.logger.warning("Failed to create ROI overlay source: %s", e)

                        # Proceed only if we have at least one detection
                        if result and result.get("detection"):
                            params = {
                                # If overlay is available use it, else use original raw frame URL
                                "image_source_url": overlay_source_url or image_path_url,
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
                        #     "Source image deleted successfully | status=%s url=%s path=%s",
                        #     delete_response.status_code,
                        #     image_path_url,
                        #     main_image_path,
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

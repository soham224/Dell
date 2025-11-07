import sys
import numpy as np
import torch
import requests
import my_utils as mu
import config as cfg
import time
from trackbleobject import TrackableObject
from model_init import get_model_device, load_model_from_path
from deep_sort_pytorch.deep_sort.deep_sort import DeepSort

sys.path.insert(0, "./yolov5")

palette = (2**11 - 1, 2**15 - 1, 2**20 - 1)

PERSON_WEIGHT_PATH = "./yolov5/weights/crowdhuman_yolov5m.pt"
PERSON_MODEL = load_model_from_path(PERSON_WEIGHT_PATH)
DEVICE = get_model_device()
cam = 0
url = "https://asapi.tusker.ai/api/v1/add_person_count"


def xyxy_to_xywh(*xyxy):
    """ " Calculates the relative bounding box from absolute pixel values."""
    bbox_left = min([xyxy[0].item(), xyxy[2].item()])
    bbox_top = min([xyxy[1].item(), xyxy[3].item()])
    bbox_w = abs(xyxy[0].item() - xyxy[2].item())
    bbox_h = abs(xyxy[1].item() - xyxy[3].item())
    x_c = bbox_left + bbox_w / 2
    y_c = bbox_top + bbox_h / 2
    w = bbox_w
    h = bbox_h
    return x_c, y_c, w, h


def detect():
    deepsort = DeepSort(
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
    totalUpPerson = 0
    totalDownPerson = 0
    trackableObjects = {}
    tracking_result_list = []
    while True:
        try:
            all_images_list = mu.get_all_images_by_camera(cam)
            processed_images_list = mu.get_processed_images()
            images_to_proceses = set(all_images_list).difference(set(processed_images_list))
            images_to_proceses = list(images_to_proceses)
            images_to_proceses.sort()
            if not len(images_to_proceses):
                time.sleep(60)
            for image_path in images_to_proceses:
                person_in_count_by_frame = 0
                person_out_count_by_frame = 0
                img, im0, image_path = mu.load_image_from_disk(
                    image_path, int(cfg.IMAGE_SIZE)
                )
                result, det, names = mu.predict(
                    PERSON_MODEL,
                    img,
                    im0,
                    DEVICE,
                    float(cfg.CONFIDENCE_THRESHOLD),
                    float(cfg.IOU_THRESHOLD),
                )
                xywh_bboxs = []
                confs = []
                # Adapt detections to deep sort input format
                if len(result["detection"]) > 0:
                    for *xyxy, conf, cls in det:
                        # to deep sort format
                        x_c, y_c, bbox_w, bbox_h = xyxy_to_xywh(*xyxy)
                        xywh_obj = [x_c, y_c, bbox_w, bbox_h]
                        xywh_bboxs.append(xywh_obj)
                        confs.append([conf.item()])
                    xywhs = torch.Tensor(xywh_bboxs)
                    confss = torch.Tensor(confs)
                    # tracked_dets = sort_tracker.update(tracking_stack)
                    outputs = deepsort.update(xywhs, confss, im0)
                    if len(outputs) > 0:
                        # middle = im0.shape[0] // 2.3
                        height = im0.shape[0]
                        for cord in outputs:
                            x_c = (cord[0] + cord[2]) / 2
                            y_c = (cord[1] + cord[3]) / 2
                            to = trackableObjects.get(cord[4], None)
                            if to is None:
                                to = TrackableObject(cord[4], (x_c, y_c))
                            else:
                                y = [c[1] for c in to.centroids]
                                direction = y_c - np.mean(y)
                                to.centroids.append((x_c, y_c))
                                if not to.counted:  # arah up
                                    if (
                                        direction < 0
                                        and cfg.ROI_LIST["line2_end"][1]
                                        > y_c
                                        > cfg.ROI_LIST["line1_end"][1]
                                    ) and (
                                        cfg.ROI_LIST["line1_start"][0]
                                        <= x_c
                                        <= cfg.ROI_LIST["line1_end"][0]
                                        or cfg.ROI_LIST["line1_end"][0]
                                        <= x_c
                                        <= cfg.ROI_LIST["line1_start"][0]
                                    ):  ##up truble when at distant car counted twice because bbox reappear
                                        totalUpPerson += 1
                                        person_out_count_by_frame += 1
                                        to.counted = True
                                    elif (
                                        direction > 0
                                        and cfg.ROI_LIST["line1_end"][1]
                                        < y_c
                                        < cfg.ROI_LIST["line2_end"][1]
                                    ) and (
                                        cfg.ROI_LIST["line1_start"][0]
                                        <= x_c
                                        <= cfg.ROI_LIST["line1_end"][0]
                                        or cfg.ROI_LIST["line1_end"][0]
                                        <= x_c
                                        <= cfg.ROI_LIST["line1_start"][0]
                                    ):  # arah down
                                        totalDownPerson += 1
                                        person_in_count_by_frame += 1
                                        to.counted = True
                            trackableObjects[cord[4]] = to
                        # print(">>>>>>>",person_out_count_by_frame,person_in_count_by_frame)
                        if person_out_count_by_frame > 0 or person_in_count_by_frame > 0:
                            response = requests.post(url, json={"in_count": person_in_count_by_frame,"out_count": person_out_count_by_frame,"status": True,"company_id": 82,"camera_id":464})
                            # print("in if condtion",response.json())
                            if response.status_code == 200:
                                print("Request was successful!")
                            # curr_time = datetime.now(timezone.utc)
                else:
                    deepsort.increment_ages()
            mu.update_processed_images_list(images_to_proceses)
            # print("tracking result", totalUpPerson, totalDownPerson)
        except Exception as e:
            cfg.logger.info(f"{e}")
            print("exception",e)


if __name__ == "__main__":
    detect()

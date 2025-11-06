import datetime
import json
import logging
import math
from datetime import timedelta

import pymongo
from bson.json_util import dumps
from bson.objectid import ObjectId

import crud

from core.config import settings

mongo_client = pymongo.MongoClient(
    host=settings.MONGO_HOST,
    port=int(settings.MONGO_PORT),
    username=settings.MONGO_USER,
    password=settings.MONGO_PASS,
    authSource=settings.MONGO_AUTH_DB_NAME,
)

db = mongo_client[settings.MONGO_DB]
collection = db[settings.MONGO_COLL_NAME]
PAGE_SIZE = 10
RESULT_MANAGER_PAGE_SIZE = 8


def raise_notification(notification_details, db):
    try:
        if isinstance(notification_details, dict):
            obj_in = notification_details
        else:
            obj_in = notification_details.dict(exclude_unset=True)
        out_obj = crud.notification_crud_obj.create(db=db, obj_in=obj_in)
        return out_obj
    except Exception as e:
        logging.error("Exception add_notification_utils : {} ".format(e))
        return []


def get_camera_id_list_by_location_list(location_list, db):
    try:
        deployment_camera_list = (
            crud.deployment_camera_crud_obj.get_total_cameras_by_location(
                db, location_list
            )
        )
        if not deployment_camera_list:
            logging.info("No Camera Found For User")
            return []
        camera_id = []
        for camera in deployment_camera_list:
            camera_id.append(str(camera.id))
        return camera_id
    except Exception as e:
        logging.error("Exception get_camera_id_list_for_supervisor : {} ".format(e))
        return []


def get_initial_info_by_user(
    user_id, camera_id_list, label_list, start_date, end_date, page_size
):
    try:
        my_filter = {
            "user_id": str(user_id),
            "is_hide": False,
            "result.detection.0": {"$exists": True},
        }
        if camera_id_list:
            my_filter["camera_id"] = {"$in": camera_id_list}
        if label_list:
            my_filter["$or"] = []
            for label in label_list:
                my_filter["$or"].append({"counts.{}".format(label): {"$exists": True}})
        if start_date and end_date:
            my_filter["frame_date"] = {"$gte": start_date, "$lte": end_date}

        total_records = collection.count_documents(my_filter)

        if total_records > 0:
            total_pages = math.ceil(total_records / page_size)
            return {
                "page_size": page_size,
                "total_pages": total_pages,
                "total_count": total_records,
            }
        else:
            return {"page_size": page_size, "total_pages": 0, "total_count": 0}
    except Exception as e:
        logging.error("Exception get_result_by_user_camera : {} ".format(e))
        return {"page_size": page_size, "total_pages": 0, "total_count": 0}


def get_initial_info(camera_id_list, label_list, start_date, end_date, page_size):
    try:
        my_filter = {
            "is_hide": False,
            "result.detection.0": {"$exists": True},
        }
        if camera_id_list:
            my_filter["camera_id"] = {"$in": camera_id_list}
        if label_list:
            my_filter["$or"] = []
            for label in label_list:
                my_filter["$or"].append({"counts.{}".format(label): {"$exists": True}})
        if start_date and end_date:
            my_filter["frame_date"] = {"$gte": start_date, "$lte": end_date}

        total_records = collection.count_documents(my_filter)

        if total_records > 0:
            total_pages = math.ceil(total_records / page_size)
            return {
                "page_size": page_size,
                "total_pages": total_pages,
                "total_count": total_records,
            }
        else:
            return {"page_size": page_size, "total_pages": 0, "total_count": 0}
    except Exception as e:
        logging.error("Exception get_result_by_user_camera : {} ".format(e))
        return {"page_size": page_size, "total_pages": 0, "total_count": 0}


def get_paginated_result_by_user(
    user_id, camera_id_list, page_number, label_list, start_date, end_date, page_size
):
    try:
        my_filter = {
            "user_id": str(user_id),
            "is_hide": False,
            "result.detection.0": {"$exists": True},
        }
        if camera_id_list:
            my_filter["camera_id"] = {"$in": camera_id_list}
        if label_list:
            my_filter["$or"] = []
            for label in label_list:
                my_filter["$or"].append({"counts.{}".format(label): {"$exists": True}})
        if start_date and end_date:
            my_filter["frame_date"] = {"$gte": start_date, "$lte": end_date}

        skip_number = page_size * (page_number - 1)

        connection_cursor = (
            collection.find(my_filter)
            .sort("frame_date", -1)
            .skip(skip_number)
            .limit(page_size)
        )
        data = dumps(connection_cursor)
        return data
    except Exception as e:
        logging.error("Exception get_paginated_result : {} ".format(e))
        return []


def get_paginated_result(
    camera_id_list, page_number, label_list, start_date, end_date, page_size
):
    try:
        my_filter = {
            "is_hide": False,
            "result.detection.0": {"$exists": True},
        }
        if camera_id_list:
            my_filter["camera_id"] = {"$in": camera_id_list}
        if label_list:
            my_filter["$or"] = []
            for label in label_list:
                my_filter["$or"].append({"counts.{}".format(label): {"$exists": True}})
        if start_date and end_date:
            my_filter["frame_date"] = {"$gte": start_date, "$lte": end_date}

        skip_number = page_size * (page_number - 1)

        connection_cursor = (
            collection.find(my_filter)
            .sort("frame_date", -1)
            .skip(skip_number)
            .limit(page_size)
        )
        data = dumps(connection_cursor)
        return data
    except Exception as e:
        logging.error("Exception get_paginated_result : {} ".format(e))
        return []


def get_result_by_ides(id_list):
    try:
        my_filter = {
            "_id": {"$in": [ObjectId(id) for id in id_list]},
        }
        connection_cursor = collection.find(my_filter)
        return json.loads(dumps(connection_cursor))
    except Exception as e:
        logging.error("Exception get_result_by_ides : {} ".format(e))
        return []


def get_processed_images(
    user_id,
    camera_id,
    start_date,
    end_date,
):
    try:
        my_filter = {
            "user_id": str(user_id),
            "is_hide": False,
        }
        if camera_id:
            my_filter["camera_id"] = {"$in": [str(cid) for cid in camera_id]}
        if start_date and end_date:
            my_filter["frame_date"] = {"$gte": start_date, "$lt": end_date}

        connection_count = collection.count_documents(my_filter)
        return connection_count
    except Exception as e:
        logging.error("Exception get_today_processed_images : {} ".format(e))
        return []


def get_today_total_detection(user_id, camera_id, selected_model_labels):
    try:
        today = datetime.datetime.utcnow()
        start_date = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(1)

        my_filter = {
            "user_id": str(user_id),
            "is_hide": False,
            "result.detection.0": {"$exists": "true"},
            "frame_date": {"$gte": start_date, "$lt": end_date},
        }
        if "-1" not in selected_model_labels.split(",") and selected_model_labels:
            selected_labels_list = selected_model_labels.split(",")
            my_filter["result.detection.label"] = {"$in": selected_labels_list}
        if camera_id:
            my_filter["camera_id"] = {"$in": [str(cid) for cid in camera_id]}
        my_filter["result.detection.0"] = {"$exists": "true"}
        connection_count = collection.count_documents(my_filter)
        return connection_count
    except Exception as e:
        logging.error("Exception get_today_total_detection : {} ".format(e))
        return []


def get_total_detection(
    user_id, camera_id, start_date, end_date, selected_model_labels
):
    try:
        my_filter = {
            "user_id": str(user_id),
            "is_hide": False,
            "result.detection.0": {"$exists": "true"},
        }
        if "-1" not in selected_model_labels.split(",") and selected_model_labels:
            selected_labels_list = selected_model_labels.split(",")
            my_filter["result.detection.label"] = {"$in": selected_labels_list}
        if camera_id:
            my_filter["camera_id"] = {"$in": [str(cid) for cid in camera_id]}
        if start_date and end_date:
            my_filter["frame_date"] = {"$gte": start_date, "$lt": end_date}
        connection_count = collection.count_documents(my_filter)
        return connection_count
    except Exception as e:
        logging.error("Exception get_today_total_detection : {} ".format(e))
        return []


def get_initial_final_mongo_filter(duration_type, my_filter, selected_model_labels):
    try:
        selected_model_labels_list = selected_model_labels.split(",")
        group_obj = {}
        hour_group_obj = {}
        project_obj = {
            "_id": {"$toString": "$_id"},
            "time": {
                "$concat": [
                    {"$toString": {"$hour": "$frame_date"}},
                    ":",
                    {"$toString": {"$minute": "$frame_date"}},
                    ":",
                    {"$toString": {"$second": "$frame_date"}},
                ]
            },
        }
        for labels in selected_model_labels_list:
            label_json = {}
            hour_label_json = {}
            project_obj[labels] = "$counts." + labels
            label_json[labels] = {"$sum": "$counts." + labels}
            hour_label_json[labels] = {"$first": "$" + labels}
            group_obj.update(label_json)
            hour_group_obj.update(hour_label_json)
        if duration_type == "day":
            group_obj["_id"] = "$month"
            final_filter = [
                {"$match": my_filter},
                {
                    "$project": {
                        "counts": "$counts",
                    }
                },
                {"$group": group_obj},
                {"$sort": {"_id": 1}},
            ]
        return final_filter
    except Exception as e:
        logging.error("Exception get_initial_final_mongo_filter : {} ".format(e))
        return []


def get_final_mongo_filter(
    duration_type, my_filter, selected_model_labels, local_timezone
):
    try:
        time_zone_convert_date = {"date": "$frame_date", "timezone": local_timezone}
        selected_model_labels_list = selected_model_labels.split(",")
        group_obj = {}
        hour_group_obj = {}
        project_obj = {
            "_id": {"$toString": "$_id"},
            "time": {
                "$concat": [
                    {"$toString": {"$hour": time_zone_convert_date}},
                    ":",
                    {"$toString": {"$minute": time_zone_convert_date}},
                    ":",
                    {"$toString": {"$second": time_zone_convert_date}},
                ]
            },
        }
        for labels in selected_model_labels_list:
            label_json = {}
            hour_label_json = {}
            project_obj[labels] = "$counts." + labels
            label_json[labels] = {"$sum": "$counts." + labels}
            hour_label_json[labels] = {"$sum": "$" + labels}
            group_obj.update(label_json)
            hour_group_obj.update(hour_label_json)
        if duration_type == "month":
            group_obj["_id"] = "$month"
            final_filter = [
                {"$match": my_filter},
                {
                    "$project": {
                        "counts": "$counts",
                        "month": {
                            "$dateToString": {
                                "format": "%Y-%m",
                                "date": "$frame_date",
                                "timezone": local_timezone,
                            }
                        },
                    }
                },
                {"$group": group_obj},
                {"$sort": {"_id": 1}},
            ]
        if duration_type == "day":
            group_obj["_id"] = "$month"
            final_filter = [
                {"$match": my_filter},
                {
                    "$project": {
                        "counts": "$counts",
                        "month": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$frame_date",
                                "timezone": local_timezone,
                            }
                        },
                    }
                },
                {"$group": group_obj},
                {"$sort": {"_id": 1}},
            ]
        if duration_type == "hour":
            hour_group_obj["_id"] = "$time"
            hour_group_obj["id"] = {"$addToSet": "$_id"}
            if selected_model_labels_list:
                for labels in selected_model_labels_list:
                    my_filter["counts." + labels] = {"$exists": "true"}
            final_filter = [
                {"$match": my_filter},
                {"$project": project_obj},
                {"$group": hour_group_obj},
                {"$sort": {"_id": 1}},
            ]
        return final_filter
    except Exception as e:
        logging.error("Exception get_final_mongo_filter : {} ".format(e))
        return []


def get_supervisor_filter_mongo_data(
    user_id,
    camera_id,
    start_date,
    end_date,
    selected_model_labels,
    duration_type,
    local_timezone,
    *args,
):
    selected_model_labels = ",".join(set(selected_model_labels.split(",")))
    try:
        my_filter = {"user_id": str(user_id), "is_hide": False}
        if camera_id:
            my_filter = {
                "user_id": str(user_id),
                "camera_id": {"$in": [str(cid) for cid in camera_id]},
                "is_hide": False,
                "result.detection.0": {"$exists": True},
            }
        if start_date and end_date:
            my_filter = {
                "user_id": str(user_id),
                "is_hide": False,
                "result.detection.0": {"$exists": True},
                "frame_date": {"$gte": start_date, "$lt": end_date},
            }

        if start_date and end_date and camera_id:
            my_filter = {
                "user_id": str(user_id),
                "camera_id": {"$in": [str(cid) for cid in camera_id]},
                "is_hide": False,
                "result.detection.0": {"$exists": True},
                "frame_date": {"$gte": start_date, "$lt": end_date},
            }

        selected_model_labels_list = selected_model_labels.split(",")
        if (
            selected_model_labels
            and duration_type != "month"
            and len(selected_model_labels_list) == 1
        ):
            my_filter["$or"] = [
                {f"counts.{label}": {"$exists": True}}
                for label in selected_model_labels.split(",")
            ]

        if args:
            final_filter = get_initial_final_mongo_filter(
                duration_type, my_filter, selected_model_labels
            )
            connection_cursor = collection.aggregate(final_filter)
            data = list(connection_cursor)
            if data:
                data[0]["_id"] = str(args[1]).split(" ")[0]
                return data
            else:
                return []
        else:
            final_filter = get_final_mongo_filter(
                duration_type, my_filter, selected_model_labels, local_timezone
            )
            connection_cursor = collection.aggregate(final_filter)
            data = list(connection_cursor)
            return data
    except Exception as e:
        logging.error("Exception get_supervisor_filter_mongo_data : {} ".format(e))
        return []


def get_superuser_filter_mongo_data(
    camera_id,
    start_date,
    end_date,
    selected_model_labels,
    duration_type,
    local_timezone,
    *args,
):
    selected_model_labels = ",".join(set(selected_model_labels.split(",")))
    try:
        my_filter = {"is_hide": False}
        if camera_id:
            my_filter = {
                "camera_id": {"$in": [str(cid) for cid in camera_id]},
                "is_hide": False,
                "result.detection.0": {"$exists": True},
            }
        if start_date and end_date:
            my_filter = {
                "is_hide": False,
                "result.detection.0": {"$exists": True},
                "frame_date": {"$gte": start_date, "$lt": end_date},
            }

        if start_date and end_date and camera_id:
            my_filter = {
                "camera_id": {"$in": [str(cid) for cid in camera_id]},
                "is_hide": False,
                "result.detection.0": {"$exists": True},
                "frame_date": {"$gte": start_date, "$lt": end_date},
            }

        selected_model_labels_list = selected_model_labels.split(",")
        if (
            selected_model_labels
            and duration_type != "month"
            and len(selected_model_labels_list) == 1
        ):
            my_filter["$or"] = [
                {f"counts.{label}": {"$exists": True}}
                for label in selected_model_labels.split(",")
            ]

        if args:
            final_filter = get_initial_final_mongo_filter(
                duration_type, my_filter, selected_model_labels
            )
            connection_cursor = collection.aggregate(final_filter)
            data = list(connection_cursor)
            if data:
                data[0]["_id"] = str(args[1]).split(" ")[0]
                return data
            else:
                return []
        else:
            final_filter = get_final_mongo_filter(
                duration_type, my_filter, selected_model_labels, local_timezone
            )
            connection_cursor = collection.aggregate(final_filter)
            data = list(connection_cursor)
            return data
    except Exception as e:
        logging.error("Exception get_supervisor_filter_mongo_data : {} ".format(e))
        return []


def get_data_of_last_graph_step_list(data_id):
    try:
        connection_cursor = collection.find(
            {"_id": {"$in": [ObjectId(single_id) for single_id in data_id.split(",")]}}
        )
        data = dumps(connection_cursor)
        return data
    except Exception as e:
        logging.error("Exception get_data_of_last_graph_step : {} ".format(e))
        return []


def get_result_popup_data(user_id, start_date, end_date, label_list, camera_list):
    try:
        match_1 = {
            "$match": {
                "user_id": str(user_id),
                "camera_id": {"$in": camera_list},
                "$or": [
                    {f"counts.{label_str}": {"$exists": True}}
                    for label_str in label_list
                ],
                "frame_date": {"$gte": start_date, "$lte": end_date},
                "is_hide": False,
            }
        }
        unwind = {"$unwind": {"path": "$result.detection"}}
        match_2 = {"$match": {"result.detection.label": {"$in": label_list}}}
        sort = {"$sort": {"frame_date": 1}}
        group = {
            "$group": {
                "_id": "$image_url",
                "doc": {"$first": "$$ROOT"},  # keep full document
                "detections": {"$push": "$result.detection"},
            }
        }

        project = {
            "$project": {
                "_id": "$doc._id",
                "user_id": "$doc.user_id",
                "camera_id": "$doc.camera_id",
                "image_name": "$doc.image_name",
                "image_url": "$doc.image_url",
                "video_url": "$doc.video_url",
                "result": "$detections",  # merged detections
                "is_hide": "$doc.is_hide",
                "frame_date": "$doc.frame_date",
                "status": "$doc.status",
                "counts": "$doc.counts",
                "created_date": "$doc.created_date",
                "update_date": "$doc.update_date",
                "is_deleted": "$doc.is_deleted",
            }
        }
        return dumps(
            collection.aggregate([match_1, unwind, match_2, sort, group, project])
        )
    except Exception as e:
        logging.error("Exception get_result_popup_data : {} ".format(e))
        return []

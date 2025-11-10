"""AWS integration utilities.

Helpers for S3 uploads/downloads, ECS task/service orchestration, Rekognition
collection management, DynamoDB operations, and SQS/SNS messaging.

Security note: This module relies on credentials configured via environment
variables or the AWS default credential chain. Do not hardcode secrets.

Category: Core / Integrations / AWS
"""

import json
import logging

import boto3
from botocore.exceptions import ClientError
import time

from core.config import settings

import urllib.request
import numpy as np
import cv2
import os

S3_BASE_URL = "https://{}.s3.{}.amazonaws.com".format(
    settings.TEST_IMG_STORAGE_BUCKET, settings.AWS_DEFAULT_REGION
)
S3_MAIN_BUCKET_URL = "https://{}.s3.{}.amazonaws.com".format(
    settings.TEST_IMG_STORAGE_BUCKET, settings.AWS_DEFAULT_REGION
)


def upload_image_to_s3(file_name, object_name, bucket_name, delete_local):
    """Upload a file to an S3 bucket

    :param delete_local: delete from local or not
    :param bucket_name: name of the bucket
    :param file_name: File to upload
    :param object_name: S3 object name. If not specified then file_name is used
    :return: uploaded image URL
    """
    s3_client = boto3.client("s3")
    try:
        s3_client.upload_file(file_name, bucket_name, object_name)
        image_url = S3_BASE_URL + "/" + object_name
        return image_url
    except ClientError as e:
        logging.error("Exception in S3 upload : {} ".format(e))
        return False
    finally:
        # remove image from local
        if delete_local:
            os.remove(file_name)


def upload_image_to_s3_main_bucket(file_name, object_name, bucket_name, delete_local):
    """Upload a file to an S3 bucket

    :param delete_local: delete from local or not
    :param bucket_name: name of the bucket
    :param file_name: File to upload
    :param object_name: S3 object name. If not specified then file_name is used
    :return: uploaded image URL
    """
    s3_client = boto3.client("s3")
    try:
        s3_client.upload_file(
            file_name,
            bucket_name,
            object_name,
            ExtraArgs={"ACL": "bucket-owner-full-control"},
        )
        image_url = S3_MAIN_BUCKET_URL + "/" + object_name
        return image_url
    except ClientError as e:
        logging.error("Exception in S3 upload : {} ".format(e))
        return False
    finally:
        # remove image from local
        if delete_local:
            os.remove(file_name)


def upload_complaint_file_on_s3(user_id, file):
    try:
        dirname = os.path.abspath(__file__)
        file_path = dirname.rsplit("/", 2)
        file_location = f"{file_path[0]}/files/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        s3_key = (
            "as_complaints/"
            + str(user_id)
            + "/"
            + "complaint_image/"
            + str(int(time.time()))
            + "/"
            + file.filename
        )
        image_url = upload_image_to_s3_main_bucket(
            file_location, s3_key, settings.TEST_IMG_STORAGE_BUCKET, True
        )
        return image_url
    except Exception as e:
        logging.error("Exception upload_file_on_s3 : {} ".format(e))
        return ""


def apply_policy_to_bucket(bucket_name, region):
    try:
        s3_client = boto3.client("s3", region_name=region)
        bucket_policy = {
            "Version": "2012-10-17",
            "Id": "http referer policy example",
            "Statement": [
                {
                    "Sid": "Allow get requests originated from www.example.com and example.com",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::{}/*".format(bucket_name),
                    "Condition": {
                        "StringLike": {
                            "aws:Referer": [
                                "https://*.tusker.ai/*",
                                "https://tusker.ai/*",
                            ]
                        }
                    },
                }
            ],
        }

        bucket_policy = json.dumps(bucket_policy)

        s3_client.put_bucket_policy(Bucket=bucket_name, Policy=bucket_policy)
        return True
    except Exception as e:
        logging.error("Exception apply_policy_to_bucket : {} ".format(e))
        return False


def check_and_create_bucket(bucket_name, region):
    try:
        s3_client = boto3.client("s3", region_name=region)
        bucket_details = s3_client.create_bucket(
            Bucket=bucket_name, CreateBucketConfiguration={"LocationConstraint": region}
        )
        is_applied = apply_policy_to_bucket(bucket_name, region)
        if is_applied:
            logging.info("Policy is applied to the bucket")
        else:
            logging.info("Policy is not applied to the bucket")
        return bucket_details
    except s3_client.exceptions.BucketAlreadyOwnedByYou:
        logging.info("Bucket Exist !")
        return True
    except Exception as e:
        logging.error("Exception check_and_create_bucket : {} ".format(e))
        return False


def upload_test_file_on_s3(user_id, file):
    try:
        dirname = os.path.abspath(__file__)
        logging.info("dirname :: {}".format(dirname))
        file_path = dirname.rsplit("/", 2)
        logging.info("file_path :: {}".format(file_path))
        file_location = f"{file_path[0]}/files/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        s3_key = (
            "as/"
            + str(user_id)
            + "/"
            + "frame"
            + "/"
            + str(int(time.time()))
            + "/"
            + file.filename
        )
        return s3_key
    except Exception as e:
        logging.error("Exception upload_file_on_s3 : {} ".format(e))
        return ""


def setup_ecs_rtsp(deployment_job_rtsp_details, bucket_name):
    try:
        deployment_region = (
            deployment_job_rtsp_details.user_details.company.deployment_region
        )
        company_name = (
            deployment_job_rtsp_details.user_details.company.company_name.split(" ")[0]
        )
        company_id = deployment_job_rtsp_details.user_details.company.id
        ecs_client = boto3.client("ecs", region_name=deployment_region)
        total_cameras = len(deployment_job_rtsp_details.camera_settings)

        container_def = [
            {
                "name": "tusker-frame-extractor-container-{}-{}".format(
                    company_name, company_id
                ),
                "image": settings.FRAME_EXTRACTOR_URI,
                "essential": True,
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-create-group": "true",
                        "awslogs-group": "/ecs/tusker-frame-extractor-logs-{}-{}".format(
                            company_name, company_id
                        ),
                        "awslogs-region": deployment_region,
                        "awslogs-stream-prefix": "ecs",
                    },
                },
                "environment": [
                    {"name": "COMPANY_IMG_STORE_BUCKET", "value": bucket_name},
                    {"name": "DB_HOST", "value": settings.MYSQL_HOSTNAME},
                    {"name": "DB_NAME", "value": settings.MYSQL_DB_NAME},
                    {"name": "DB_PASS", "value": settings.MYSQL_PASS},
                    {"name": "DB_PORT", "value": str(settings.MYSQL_PORT)},
                    {"name": "DB_USERNAME", "value": settings.MYSQL_USERNAME},
                    {
                        "name": "DEPLOYMENT_JOB_RTSP_ID",
                        "value": str(deployment_job_rtsp_details.id),
                    },
                    {"name": "UPLOAD_INTERVAL", "value": "2"},
                ],
            }
        ]

        if 0 < total_cameras < 4:
            # 512 m - 256 c
            memory_limit = "512"
            cpu_limit = "256"
        elif 4 <= total_cameras < 9:
            # 1 m - 0.5 c
            memory_limit = "1024"
            cpu_limit = "512"
        elif total_cameras >= 9:
            # 2 m - 1 c
            memory_limit = "2048"
            cpu_limit = "1024"

        logging.info(
            "total cameras : {} || memory : {} || cpu : {}".format(
                total_cameras, memory_limit, cpu_limit
            )
        )

        register_task_response = ecs_client.register_task_definition(
            containerDefinitions=container_def,
            family="tusker-frame-extractor-{}-{}".format(company_name, company_id),
            networkMode="awsvpc",
            requiresCompatibilities=["FARGATE"],
            memory=memory_limit,
            cpu=cpu_limit,
            taskRoleArn=settings.TD_TASK_ROLE_ARN,
            executionRoleArn=settings.TD_EXECUTION_ROLE_ARN,
        )
        logging.info("register_task_response :: {}".format(register_task_response))

        create_service_response = ecs_client.create_service(
            cluster="tusker-external-apps",
            serviceName="tusker-frame-extractor-service-{}-{}-{}".format(
                company_name, company_id, deployment_job_rtsp_details.id
            ),
            launchType="FARGATE",
            taskDefinition="tusker-frame-extractor-{}-{}".format(
                company_name, company_id
            ),
            desiredCount=1,
            clientToken="request_identifier_string",
            networkConfiguration={
                "awsvpcConfiguration": {
                    "subnets": settings.ECS_SERVICE_SUBNETS,
                    "securityGroups": settings.ECS_SERVICE_SG,
                    "assignPublicIp": "ENABLED",
                }
            },
        )
        logging.info("create_service_response :: {}".format(create_service_response))
        return True
    except Exception as e:
        logging.info("Exception setup_ecs_rtsp : {} ".format(e))
        return False


def upload_employee_image(user_id, employee_name, file):
    try:
        dirname = os.path.abspath(__file__)
        file_path = dirname.rsplit("/", 2)
        file_location = f"{file_path[0]}/files/{file.filename}"
        with open(file_location, "wb+") as file_object:
            file_object.write(file.file.read())
        s3_key = (
            "as_employee/"
            + str(user_id)
            + "/"
            + "employee"
            + "/"
            + str(int(time.time()))
            + "/"
            + employee_name.split(" ")[0]
            + ".png"
        )
        return s3_key, upload_image_to_s3_main_bucket(
            file_location, s3_key, settings.TEST_IMG_STORAGE_BUCKET, True
        )
    except Exception as e:
        logging.error("Exception upload_employee_image : {} ".format(e))
        return ""


def register_and_run_task_for_attendance_report(user):
    try:
        deployment_region = user.company.deployment_region
        company_name = user.company.company_name.split(" ")[0]
        company_id = str(user.company.id)
        user_id = user.id
        ecs_client = boto3.client("ecs", region_name=deployment_region)
        list_task_definitions_response = ecs_client.list_task_definitions(
            familyPrefix="tusker-attendance-{}".format(str(company_id)),
            status="ACTIVE",
            sort="ASC",
            maxResults=100,
        )
        logging.info(
            "list_task_definitions_response :: {}".format(
                list_task_definitions_response
            )
        )
        if (
            list_task_definitions_response
            and list_task_definitions_response["taskDefinitionArns"]
        ):
            run_task_response = ecs_client.run_task(
                cluster="Tusker-AI",  # name of the cluster
                launchType="FARGATE",
                taskDefinition="tusker-attendance-{}".format(company_id),
                # replace with your task definition name and revision
                count=1,
                platformVersion="LATEST",
                networkConfiguration={
                    "awsvpcConfiguration": {
                        "subnets": settings.ECS_SERVICE_SUBNETS,
                        "securityGroups": settings.ECS_SERVICE_SG,
                        "assignPublicIp": "DISABLED",
                    }
                },
            )
            logging.info("run_task_response :: {}".format(run_task_response))
            return True
        else:
            container_def = [
                {
                    "name": "attendance_module-{}".format(company_name),
                    "image": settings.ATTENDANCE_REPORT_URI,
                    "essential": True,
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-create-group": "true",
                            "awslogs-group": "/ecs/tusker-{}".format(company_name),
                            "awslogs-region": deployment_region,
                            "awslogs-stream-prefix": "ecs",
                        },
                    },
                    "environment": [
                        {"name": "DB_HOST", "value": settings.MYSQL_HOSTNAME},
                        {"name": "DB_NAME", "value": settings.MYSQL_DB_NAME},
                        {"name": "DB_PASS", "value": settings.MYSQL_PASS},
                        {"name": "DB_USERNAME", "value": settings.MYSQL_USERNAME},
                        {"name": "MONGO_HOST", "value": settings.MONGO_HOST},
                        {"name": "MONGO_PORT", "value": str(settings.MONGO_PORT)},
                        {"name": "MONGO_DB", "value": settings.MONGO_DB},
                        {"name": "MONGO_USER", "value": settings.MONGO_USER},
                        {"name": "MONGO_PASS", "value": settings.MONGO_PASS},
                        {"name": "COMPANY_ID", "value": str(company_id)},
                        {
                            "name": "FACES_STORE_BUCKET",
                            "value": settings.FACES_STORE_BUCKET,
                        },
                        {
                            "name": "FACES_COLLECTION_NAME",
                            "value": "tusker_{}".format(str(company_id)),
                        },
                        {"name": "USER_ID", "value": str(user_id)},
                    ],
                    "mountPoints": [{"containerPath": "/data", "sourceVolume": "data"}],
                }
            ]
            register_task_response = ecs_client.register_task_definition(
                containerDefinitions=container_def,
                family="tusker-attendance-{}".format(company_id),
                networkMode="awsvpc",
                requiresCompatibilities=["FARGATE"],
                memory=settings.ECS_MEMORY_LIMIT,
                cpu=settings.ECS_CPU_LIMIT,
                taskRoleArn=settings.TASK_ROLE_ARN,
                executionRoleArn=settings.EXECUTION_ROLE_ARN,
                volumes=[{"name": "data"}],
            )
            logging.info("register_task_response :: {}".format(register_task_response))
            run_task_response = ecs_client.run_task(
                cluster="Tusker-AI",  # name of the cluster
                launchType="FARGATE",
                taskDefinition="tusker-attendance-{}".format(company_id),
                # replace with your task definition name and revision
                count=1,
                platformVersion="LATEST",
                networkConfiguration={
                    "awsvpcConfiguration": {
                        "subnets": settings.ECS_SERVICE_SUBNETS,
                        "securityGroups": settings.ECS_SERVICE_SG,
                        "assignPublicIp": "DISABLED",
                    }
                },
            )
            logging.info("run_task_response :: {}".format(run_task_response))
            return True
    except Exception as e:
        logging.error("Exception register_and_run_task : {} ".format(e))
        return False


def register_and_run_task_for_violation_report(user):
    try:
        deployment_region = user.company.deployment_region
        company_name = user.company.company_name.split(" ")[0]
        company_id = str(user.company.id)
        user_id = user.id
        ecs_client = boto3.client("ecs", region_name=deployment_region)
        list_task_definitions_response = ecs_client.list_task_definitions(
            familyPrefix="tusker-violation-{}".format(str(company_id)),
            status="ACTIVE",
            sort="ASC",
            maxResults=100,
        )
        logging.info(
            "list_task_definitions_response :: {}".format(
                list_task_definitions_response
            )
        )
        if (
            list_task_definitions_response
            and list_task_definitions_response["taskDefinitionArns"]
        ):
            run_task_response = ecs_client.run_task(
                cluster="Tusker-AI",  # name of the cluster
                launchType="FARGATE",
                taskDefinition="tusker-violation-{}".format(company_id),
                # replace with your task definition name and revision
                count=1,
                platformVersion="LATEST",
                networkConfiguration={
                    "awsvpcConfiguration": {
                        "subnets": settings.ECS_SERVICE_SUBNETS,
                        "securityGroups": settings.ECS_SERVICE_SG,
                        "assignPublicIp": "DISABLED",
                    }
                },
            )
            logging.info("run_task_response :: {}".format(run_task_response))
            return True
        else:
            container_def = [
                {
                    "name": "data-fr-module-{}".format(company_name),
                    "image": settings.VIOLATION_REPORT_URI,
                    "essential": True,
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-create-group": "true",
                            "awslogs-group": "/ecs/tusker-{}".format(company_name),
                            "awslogs-region": deployment_region,
                            "awslogs-stream-prefix": "ecs",
                        },
                    },
                    "environment": [
                        {"name": "DB_HOST", "value": settings.MYSQL_HOSTNAME},
                        {"name": "DB_NAME", "value": settings.MYSQL_DB_NAME},
                        {"name": "DB_PASS", "value": settings.MYSQL_PASS},
                        {"name": "DB_USERNAME", "value": settings.MYSQL_USERNAME},
                        {"name": "MONGO_HOST", "value": settings.MONGO_HOST},
                        {"name": "MONGO_PORT", "value": str(settings.MONGO_PORT)},
                        {"name": "MONGO_DB", "value": settings.MONGO_DB},
                        {"name": "MONGO_USER", "value": settings.MONGO_USER},
                        {"name": "MONGO_PASS", "value": settings.MONGO_PASS},
                        {"name": "COMPANY_ID", "value": str(company_id)},
                        {
                            "name": "FACES_STORE_BUCKET",
                            "value": settings.FACES_STORE_BUCKET,
                        },
                        {
                            "name": "FACES_COLLECTION_NAME",
                            "value": "tusker_{}".format(str(company_id)),
                        },
                        {"name": "USER_ID", "value": str(user_id)},
                        {
                            "name": "AWS_DEFAULT_REGION",
                            "value": settings.AWS_DEFAULT_REGION,
                        },
                    ],
                    "mountPoints": [{"containerPath": "/data", "sourceVolume": "data"}],
                }
            ]
            register_task_response = ecs_client.register_task_definition(
                containerDefinitions=container_def,
                family="tusker-violation-{}".format(company_id),
                networkMode="awsvpc",
                requiresCompatibilities=["FARGATE"],
                memory=settings.ECS_MEMORY_LIMIT,
                cpu=settings.ECS_CPU_LIMIT,
                taskRoleArn=settings.TASK_ROLE_ARN,
                executionRoleArn=settings.EXECUTION_ROLE_ARN,
                volumes=[{"name": "data"}],
            )
            logging.info("register_task_response :: {}".format(register_task_response))
            run_task_response = ecs_client.run_task(
                cluster="Tusker-AI",  # name of the cluster
                launchType="FARGATE",
                taskDefinition="tusker-violation-{}".format(company_id),
                # replace with your task definition name and revision
                count=1,
                platformVersion="LATEST",
                networkConfiguration={
                    "awsvpcConfiguration": {
                        "subnets": settings.ECS_SERVICE_SUBNETS,
                        "securityGroups": settings.ECS_SERVICE_SG,
                        "assignPublicIp": "DISABLED",
                    }
                },
            )
            logging.info("run_task_response :: {}".format(run_task_response))
            return True
    except Exception as e:
        logging.error("Exception register_and_run_task : {} ".format(e))
        return False


def create_collection(company_id):
    try:
        collection_name = settings.GENERIC_COLLECTION_NAME + "_" + str(company_id)
        client = boto3.client("rekognition")
        response = client.create_collection(CollectionId=collection_name)
        logging.info("collection create response : {}".format(response))
        return True
    except Exception as e:
        logging.error(f"Exception in create_collection : {e}")
        return False


def get_employee_training_response(emp_id, company_id, s3_key, employee_name):
    try:
        employee_training_response = {}
        client = boto3.client("rekognition")
        response = client.index_faces(
            CollectionId=settings.GENERIC_COLLECTION_NAME + "_" + str(company_id),
            Image={
                "S3Object": {"Bucket": settings.TEST_IMG_STORAGE_BUCKET, "Name": s3_key}
            },
            ExternalImageId=str(company_id)
            + "_"
            + str(emp_id)
            + "_"
            + employee_name.split(" ")[0],
            MaxFaces=1,
            QualityFilter="AUTO",
            DetectionAttributes=["ALL"],
        )

        if response:
            # store the details into the trained_faces table
            employee_training_response["face_id"] = response["FaceRecords"][0]["Face"][
                "FaceId"
            ]
            employee_training_response["image_id"] = response["FaceRecords"][0]["Face"][
                "ImageId"
            ]
            employee_training_response["external_image_id"] = response["FaceRecords"][
                0
            ]["Face"]["ExternalImageId"]
            employee_training_response["employee_id"] = emp_id
        return employee_training_response
    except Exception as e:
        logging.error(f"Exception in get_employee_training_response : {e}")
        return {}


def delete_identities_from_trained_collection(face_id, company_id):
    try:
        client = boto3.client("rekognition")
        response = client.delete_faces(
            CollectionId=settings.GENERIC_COLLECTION_NAME + "_" + str(company_id),
            FaceIds=[face_id],
        )
        if len(response["DeletedFaces"]) > 0:
            return True
        else:
            return False
    except Exception as e:
        logging.error(f"Exception in delete_identities_from_trained_collection : {e}")
        return {}


def publish_text_message(phone_number, message):
    """
    Publishes a text message directly to a phone number without need for a
    subscription.

    :param phone_number: The phone number that receives the message. This must be
                         in E.164 format. For example, a United States phone
                         number might be +12065550101.
    :param message: The message to send.
    """
    try:
        sns = boto3.client("sns")
        number = phone_number
        sns.publish(PhoneNumber=number, Message=message)
        return True
    except Exception as e:
        logging.error(f"Exception in publish_text_message : {e}")
        return False


def get_dynamodb_key_data(table_name, key_object):
    try:
        dynamodb_resource = boto3.resource("dynamodb")
        dynamodb_table = dynamodb_resource.Table(table_name)
        data_response = dynamodb_table.get_item(Key=key_object)
        if not data_response.get("Item"):
            return False
        return data_response["Item"]
    except Exception as ex:
        logging.error(f"Exception in get_dynamodb_key_data : {ex}")
        return False


def get_dynamodb_scan_data(table_name, filter_object):
    try:
        dynamodb_resource = boto3.resource("dynamodb")
        dynamodb_table = dynamodb_resource.Table(table_name)
        data_response = dynamodb_table.scan(
            ScanFilter=filter_object, AttributesToGet=["id"]
        )
        if not data_response.get("Items"):
            return False
        return data_response["Items"]
    except Exception as ex:
        logging.error(f"Exception in get_dynamodb_scan_data : {ex}")
        return False


def get_dynamodb_models_data(table_name):
    try:
        dynamodb_resource = boto3.resource("dynamodb")
        dynamodb_table = dynamodb_resource.Table(table_name)
        response = dynamodb_table.scan(
            AttributesToGet=["model_id", "model_name"],
        )
        return response["Items"]
    except Exception as ex:
        logging.error(f"Exception in get_dynamodb_models_data : {ex}")
        return False


def update_dynamodb_video_status(table_name, key, update_value):
    try:
        dynamodb_resource = boto3.resource("dynamodb")
        dynamodb_table = dynamodb_resource.Table(table_name)
        dynamodb_table.update_item(
            Key={"id": key},
            AttributeUpdates={"video_status": {"Value": update_value, "Action": "PUT"}},
        )
        return True
    except Exception as ex:
        logging.error(f"Exception in update_dynamodb_video_status : {ex}")
        return False


def update_dynamodb_video_detection_details(table_name, key, update_value):
    try:
        dynamodb_resource = boto3.resource("dynamodb")
        dynamodb_table = dynamodb_resource.Table(table_name)
        dynamodb_table.update_item(
            Key={"id": key},
            UpdateExpression="SET #results.#detection_details.#brand_names = :update_value",
            ExpressionAttributeNames={
                "#results": "results",
                "#detection_details": "detection_details",
                "#brand_names": "brand_names",
            },
            ExpressionAttributeValues={":update_value": update_value},
        )
        return True
    except Exception as ex:
        logging.error(f"Exception in update_dynamodb_video_status : {ex}")
        return False


def download_image_from_s3(bucket_name, s3_key, file_name):
    s3_client = boto3.client("s3")
    try:
        s3_client.download_file(bucket_name, s3_key, file_name)
        return True
    except Exception as e:
        logging.error(f"Exception in S3 download : {e}")
        return False


def download_image_from_local(image_url, save_path):
    if not image_url or not save_path:
        logging.info("ERROR - image_url or save_path is empty.")
        return False

    try:
        # Open the URL and read the image
        req = urllib.request.urlopen(image_url)
        arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

        if img is None:
            print(f"Failed to decode image from URL: {image_url}")
            return False

        # Save the image to the specified path
        success = cv2.imwrite(save_path, img)
        if success:
            logging.info(f"Image saved to {save_path}")
        else:
            logging.error(f"Failed to save image to {save_path}")
        return success
    except Exception as e:
        logging.error(f"Error downloading or saving image: {e}")
        return False


def send_sqs_message(queue_url: str, message_body: dict):
    sqs_client = boto3.client("sqs")
    try:
        response = sqs_client.send_message(
            QueueUrl=queue_url, MessageBody=json.dumps(message_body)
        )
        return response
    except Exception as e:
        logging.error(f"Exception in S3 download : {e}")
        return False

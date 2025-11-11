# Repository Information
- This repository generates the frames from given rtsps.
- This id new code Version-2.

# Configuration Parameters

|       Variable       |                                                                                                                                                       Value                                                                                                                                                        |                                 Description                                 |
|:--------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:---------------------------------------------------------------------------:|
|     FRAME_SUFFIX     |                                                                                                                                                `.png, .jpg, .jpeg`                                                                                                                                                 |                        Extension for created images                         |
|       USER_ID        |                                                                                                                                                       `int`                                                                                                                                                        | local: Specify in config file <br/>AWS: Add user id in environment variable |
|   FRAMES_ROOT_DIR    |                                                                                                                                              `/home/user/client_name`                                                                                                                                              |                         Path for generated images.                          |
|  FRAME_STORAGE_TYPE  |                                                                                                                                               `dbq, filesystem, s3`                                                                                                                                                |        dbq: Mysql queue<br/>filesystem: Local system<br/>s3: AWS s3         |
|    DELETE_FRAMES     |                                                                                                                                                   `True, False`                                                                                                                                                    |                        Image need to delete or save                         |
| SLEEP_WHEN_RTSP_DOWN |                                                                                                                                                       `int`                                                                                                                                                        |                   Specify sleep time if rtsp down(second)                   |
|      CAM_SOURCE      |                                                                                                                                                    `config, db`                                                                                                                                                    |            config: From configuration file<br/>db: From database            |
|      CAM_CONFIG      | `dict`<table><tr><th>Key</th><th>Value</th></tr><tr><td>camera_name</td><td>str</td></tr><tr><td>camera_location</td><td>str</td></tr><tr><td>camera_rtsp_url</td><td>str</td></tr><tr><td>camera_status</td><td>bool</td></tr><tr><td>camera_fps</td><td>int</td></tr><tr><td>scale</td><td>int</td></tr></table> |             If CAM_SOURCE is config then add all camera details             |
|       DB_HOST        |                                                                                                                                                       `str`                                                                                                                                                        |                             Database host name                              |
|     DB_USERNAME      |                                                                                                                                                       `str`                                                                                                                                                        |                           Database username name                            |
|       DB_PASS        |                                                                                                                                                       `str`                                                                                                                                                        |                              Database password                              |
|       DB_NAME        |                                                                                                                                                       `str`                                                                                                                                                        |                                Database name                                |
|       DB_PORT        |                                                                                                                                                       `int`                                                                                                                                                        |                                Database port                                |
|      QUEUE_NAME      |                                                                                                                                                       `str`                                                                                                                                                        |                               Database queue                                |







# How to run

## Local System
1. Install python(3.10 or more) in local system.
   - command: sudo apt install python3.10
2. Install pip in local system.
   - command: sudo apt install python3-pip
3. Install all the dependencies from the [requirements.txt](requirements.txt).
   - command: pip install -r requirements.txt
4. Check the [config.py](config.py) file and set the values as needed.
5. Run main.py, this will start generating frames and store images in storage location.
   - command: python3 main.py


## AWS ECS

1. Create docker image for this project using Dockerfile.
2. Push that image in AWS ECR(Amazon Elastic Container Registry).
3. Create a task definition and add environment variable for latest push ECR image.
4. Using this task definition create a new ecs service.

# Whom to contact 
- For issues or more information, please contact mihir@softavan.in or dhairya.softvan@gmail.com

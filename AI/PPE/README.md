# PPE Detection Service

A production-oriented Python service for Personal Protective Equipment (PPE) detection (hardhat, vest, no_hardhat, no_vest). It periodically fetches frames from an API, performs YOLO-based inference, filters results per ROI/use case mapping, persists detections to a backend API, and manages frame lifecycle (copy and delete).

Author: Shruti Agarwal

## Project Structure

```
PPE/
├── app.py                    # Main loop: fetch frame → preprocess → inference → postprocess → store → cleanup
├── my_utils.py               # Image I/O, inference helpers, DB/API integrations, ROI mapping
├── config.py                 # Loads environment variables and configures logging
├── model_init.py             # Model/device initialization helpers
├── logger_config.py          # App and performance logger setup
├── requirements.txt          # Python dependencies
├── dev_envs                  # Local env vars (export ...); source this before running locally
├── Dockerfile                # Container image definition
├── docker-compose.yml        # Orchestrates service and dependencies (if any)
├── pt_model/
│   └── ppe-kit-detection-2.pt  # YOLO weights (example path used by app.py)
├── models/                   # YOLO model code
├── utils/                    # YOLO utility modules (datasets, general, torch_utils, etc.)
├── LICENSE
├── .env                      # Optional runtime environment file (not committed typically)
└── README.md                 # This file
```

Key entry points:
- `app.py`: Uses `PERSON_WEIGHT_PATH = pt_model/ppe-kit-detection-2.pt`. Loads model, loops over cameras, fetches frames via `GET_FRAME_URL`, resizes inputs to 640×640 via letterboxing, runs inference, filters detections, persists results, and cleans up frames.
- `my_utils.py`:
  - `load_image_from_url()` / `load_image_from_disk()`: load + letterbox to 640 (default `IMAGE_SIZE`).
  - `predict()`: runs YOLO forward + NMS; rescales boxes back to original frame size; returns detection dict.
  - `store_result()`: posts results to `ADD_RESULT_URL`.
  - `get_roi_by_result_type_id_and_camera_rtsp_id()`: fetches active ROI/use-case mapping from MySQL.
- `config.py`: Reads env vars (e.g., `IMAGE_SIZE`, `MODEL_CONF`, `MODEL_IOU`, DB/API endpoints); sets up loggers.

## Prerequisites
- Python 3.8+ recommended.
- MySQL reachable with credentials provided via environment variables.
- Backend APIs reachable:
  - `FRAME_STATUS_URL`, `GET_FRAME_URL`, `COPY_IMAGES_URL`, `DELETE_SOURCE_IMAGE_URL`, `ADD_RESULT_URL`.
- Model weights present at `pt_model/ppe-kit-detection-2.pt` (default) or adjust in `app.py`.

## Environment Variables
The service uses environment variables loaded in `config.py`. A ready-to-use sample is provided in `dev_envs`. Important variables:
- IMAGE_SIZE, MODEL_CONF, MODEL_IOU
- ROOT_URL, ROOT_PATH
- FRAME_STATUS_URL, GET_FRAME_URL, COPY_IMAGES_URL, DELETE_SOURCE_IMAGE_URL, ADD_RESULT_URL
- MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASS, MYSQL_DB_NAME
- RESULT_TYPE_ID, USER_ID
- CAMERA_TABLE_NAME, RESULT_MAPPING_TABLE_NAME
- LOG_BASE_DIRECTORY (directory will be created if not present)

Example: `dev_envs` (already provided in repo) can be sourced:
```
source dev_envs
```

## Installation (Local)
1. Create and activate a virtual environment:
```
python3 -m venv .venv
source .venv/bin/activate
```
2. Install dependencies:
```
pip install --upgrade pip
pip install -r requirements.txt
```
3. Set environment variables:
```
source dev_envs
```
4. Verify logging directory exists or will be created under `LOG_BASE_DIRECTORY`.

## Running (Local)
- Run the service:
```
python app.py
```
- Logs:
  - App logger: configured via `logger_config.py` under `LOG_BASE_DIRECTORY`
  - Performance logger: latency metrics for key steps

## Deployment via Docker
A `Dockerfile` and `docker-compose.yml` are provided.

### Build Image
```
docker build -t ppe-detection:latest .
```

### Run Container (simple)
Provide environment via `--env-file` or `-e` flags. Example with `.env` file:
```
docker run --rm \
  --name ppe-detection \
  --env-file .env \
  -v $(pwd)/logs:${LOG_BASE_DIRECTORY:-./logs} \
  -v $(pwd)/pt_model:/app/pt_model \
  ppe-detection:latest
```
Notes:
- Ensure the model weights are mounted or baked into the image at `/app/pt_model/ppe-kit-detection-2.pt` (or update `app.py`).
- Expose network access to MySQL and backend APIs.

### docker-compose
Fill envs in `.env` or inline in the compose file.
```
docker-compose up -d --build
```
To view logs:
```
docker-compose logs -f
```
To stop:
```
docker-compose down
```

## Inference Details
- Input preprocessing: letterbox resize to 640×640 (from `IMAGE_SIZE`) without scale-up; maintains aspect ratio with padding, as in YOLO.
- Detection classes expected: `no_vest`, `no_hardhat`, `vest`, `hardhat`.
- Post-processing rescales boxes to original frame (`scale_coords`), then filters by allowed labels from ROI/usecase mapping when present.
- Optional visualization: enable/disable with `VISUALIZE_OUTPUTS` flag in `app.py`. When enabled, annotated images are saved to `ppe_outputs/`.

## Database and ROI Mapping
- MySQL tables are configurable via `CAMERA_TABLE_NAME` and `RESULT_MAPPING_TABLE_NAME`.
- Active mapping is selected for the current UTC time window and must include PPE labels. Mappings can optionally specify allowed labels used to filter detections.

## Operations
- Frame lifecycle:
  - GET frame → process → on detection success, copy to events via `COPY_IMAGES_URL` → persist detection → delete raw frame via `DELETE_SOURCE_IMAGE_URL`.
- Robustness:
  - If HTTP load fails, falls back to local disk path.
  - Extensive logging; performance metrics for fetch, load, inference, copy, delete.

## Troubleshooting
- Missing logs: ensure `LOG_BASE_DIRECTORY` is exported and writable.
- No detections: check `MODEL_CONF`, `MODEL_IOU`, ROI allowed labels, and model weights path.
- Frame fetch errors: validate `ROOT_URL`, `ROOT_PATH`, and `GET_FRAME_URL` reachability.
- MySQL connection: verify host/port/user/pass/db in environment.

## License
See `LICENSE`.

# Intrusion Detection Service

An automated computer vision service that performs person detection and intrusion labeling over camera frames. The service polls a backend for the latest frames, runs a YOLO-based model, filters to person class, optionally labels intrusions based on ROI polygons, reports per-frame status back to the backend, and can save visualized outputs for inspection.

- Main entrypoint: `app.py`
- Model and utilities: see `models/`, `utils/`, `my_utils.py`, and `model_init.py`
- Configuration via environment variables loaded in `config.py`
- Docker and docker-compose included for GPU-enabled deployment

---

## Project Structure

```
intrusion/
├─ app.py                      # Main loop for polling frames, inference, and reporting
├─ config.py                   # Loads environment variables and sets up loggers
├─ model_init.py               # Model loading and device selection
├─ my_utils.py                 # Image I/O, ROI parsing, inference wrappers, post-processing
├─ activation.py               # Torch activation patch (copied in Docker build)
├─ logger_config.py            # Logger setup used by config
├─ requirements.txt            # Python dependencies
├─ Dockerfile                  # Docker image for GPU/CPU (CUDA specified)
├─ docker-compose.yml          # Compose service with NVIDIA runtime and .env support
├─ .env                        # Example environment file (not committed with secrets)
├─ LICENSE                     # Project license
├─ dev_envs                    # Dev helper(s)
├─ models/                     # YOLO model definitions and hub configs
│  ├─ __init__.py
│  ├─ common.py
│  └─ hub/*.yaml
├─ utils/                      # YOLO utility modules
│  ├─ __init__.py
│  ├─ activations.py
│  └─ ...
├─ pt_model/                   # Local model weights
│  ├─ person_detection.pt
│  └─ wider-person-model.pt
└─ intrusion_outputs/          # (Created at runtime) Optional visualized outputs
```

---

## Python Environment

- Python: 3.8.x
- PyTorch: 1.9.1 (CUDA 11.1 in Docker image)
- OpenCV: 4.x

Install dependencies locally:

```bash
python3.8 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

---

## Configuration (Environment Variables)

The service is configured entirely through environment variables as consumed in `config.py`. Create a `.env` file for local and Docker usage.

Required variables (no defaults):

- `IMAGE_SIZE` (e.g., 640)
- `ROOT_URL` (e.g., http://your-host)
- `ROOT_PATH` (e.g., /frames/dell)
- `SLEEP_TIME` (seconds between cycles)
- `MYSQL_HOST`
- `MYSQL_USER`
- `MYSQL_PASS`
- `MYSQL_DB_NAME`
- `MYSQL_PORT`
- `RESULT_TYPE_ID` (int)
- `USER_ID`
- `MODEL_CONF` (e.g., 0.25)
- `MODEL_IOU` (e.g., 0.45)
- `FRAME_STATUS_URL`
- `GET_FRAME_URL`
- `COPY_IMAGES_URL`
- `ADD_RESULT_URL`
- `DELETE_SOURCE_IMAGE_URL`
- `LOG_BASE_DIRECTORY` (absolute path where logs are stored on host)

Optional variables (with defaults in code):

- `PERSON_WEIGHT_PATH` (default: `pt_model/person_detection.pt`)

Example `.env` (values are illustrative only):

```env
# Core
IMAGE_SIZE=640
SLEEP_TIME=10
MODEL_CONF=0.25
MODEL_IOU=0.45
RESULT_TYPE_ID=1
USER_ID=some-user

# Model
PERSON_WEIGHT_PATH=pt_model/person_detection.pt

# Frame roots
ROOT_URL=http://127.0.0.1
ROOT_PATH=/frames/dell

# Backend APIs
FRAME_STATUS_URL=http://backend/api/v1/frames/status
GET_FRAME_URL=http://backend/api/v1/frames/get
COPY_IMAGES_URL=http://backend/api/v1/images/copy
ADD_RESULT_URL=http://backend/api/v1/results/add
DELETE_SOURCE_IMAGE_URL=http://backend/api/v1/images/delete-source

# MySQL
MYSQL_HOST=127.0.0.1
MYSQL_USER=user
MYSQL_PASS=pass
MYSQL_DB_NAME=database
MYSQL_PORT=3306

# Logging
LOG_BASE_DIRECTORY=/logs
```

Notes:
- `LOG_BASE_DIRECTORY` must exist or be volume-mounted when running in Docker.
- The app expects backend endpoints to be reachable from the container/host.

---

## Running Locally

1) Ensure `.env` is filled as above and logs directory exists if using `/logs`.

2) Activate environment and run:

```bash
source .venv/bin/activate  # if using venv
export $(grep -v '^#' .env | xargs -d '\n')
python app.py
```

- The service runs continuously, polling frames and performing inference.
- Optional visualization can be toggled in `app.py` via `VISUALIZE_OUTPUTS`.

---

## Docker

Build the image:

```bash
docker build -t tusker-vfs-crowd .
```

Run with GPU (recommended for speed):

```bash
docker run -d \
  --name tusker-vfs-crowd \
  --gpus all \
  --env-file .env \
  -v $(pwd)/logs:/logs \
  tusker-vfs-crowd
```

Run without GPU (CPU fallback) – performance will be lower:

```bash
docker run -d \
  --name tusker-vfs-crowd \
  --env-file .env \
  -v $(pwd)/logs:/logs \
  tusker-vfs-crowd
```

Logs:

```bash
docker logs -f tusker-vfs-crowd
```

Stop & remove:

```bash
docker stop tusker-vfs-crowd && docker rm tusker-vfs-crowd
```

---

## Docker Compose (Deployment)

`docker-compose.yml` defines a single service with NVIDIA runtime.

Update the `volumes` path for logs to your host path (compose currently maps `/home/mihir/logs` to `/logs`). Ensure your `.env` file is in the project root.

Start in detached mode:

```bash
docker-compose up --build -d
```

Tail logs:

```bash
docker-compose logs -f
```

Shut down:

```bash
docker-compose down
```

---

## Model Weights

- Default person detection weights: `pt_model/person_detection.pt`
- You can replace with your fine-tuned weights by updating `PERSON_WEIGHT_PATH` in `.env`.

---

## Development Notes

- The service relies on backend-provided ROIs via `my_utils.get_roi_by_result_type_id_and_camera_rtsp_id()` and relabels detections as intrusions if centers fall inside configured polygons.
- `_build_image_url()` in `app.py` maps local frame store paths (`ROOT_PATH`) to HTTP URLs (`ROOT_URL`).
- Visualizations are saved under `intrusion_outputs/` when `VISUALIZE_OUTPUTS=True`.

---

## Troubleshooting

- Missing `LOG_BASE_DIRECTORY` will raise at startup. Set it in `.env` and ensure the host directory exists and is writable.
- Verify all API endpoints are reachable and return 200 responses.
- If OpenCV errors occur in Docker, ensure `python3-opencv` and `opencv-python` are installed (handled by Dockerfile).
- For GPU: host must have NVIDIA drivers and `nvidia-container-toolkit` configured.

---

## License

This project includes a `LICENSE` file. See its contents for terms.

---

## Author

- Shruti Agarwal

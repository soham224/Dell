from my_utils import get_device, load_model
import config as cfg


def load_model_from_path(weight_path):
    """Load a YOLO model from the given weight path using detected device."""
    try:
        cfg.logger.info("Loading model from %s", weight_path)
        model = load_model(weight_path, get_device())
        cfg.logger.info("Model loading completed")
        return model
    except Exception as e:
        cfg.logger.exception("Exception in model loading: %s", e)
        raise


def get_model_device():
    """Return the selected compute device for the model (e.g., CUDA or CPU)."""
    return get_device()

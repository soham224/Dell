import cv2
import random


def _to_int(v):
    try:
        return int(round(float(v)))
    except Exception:
        return 0


def _normalize_bbox(coordinate):
    """Normalize various bbox formats to (x1, y1, x2, y2) ints.

    Supported formats:
    - dict with keys: x1,y1,x2,y2
    - dict with keys: xmin,ymin,xmax,ymax
    - dict with keys: left,top,right,bottom
    - dict with keys: x,y,w,h (converted to x1=x, y1=y, x2=x+w, y2=y+h)
    - list/tuple of 4: [x1,y1,x2,y2] or [x,y,w,h] (heuristic)
    """
    if isinstance(coordinate, dict):
        keys = {k.lower() for k in coordinate.keys()}
        if {"x1", "y1", "x2", "y2"} <= keys:
            x1 = _to_int(coordinate.get("x1"))
            y1 = _to_int(coordinate.get("y1"))
            x2 = _to_int(coordinate.get("x2"))
            y2 = _to_int(coordinate.get("y2"))
            return x1, y1, x2, y2
        if {"xmin", "ymin", "xmax", "ymax"} <= keys:
            x1 = _to_int(coordinate.get("xmin"))
            y1 = _to_int(coordinate.get("ymin"))
            x2 = _to_int(coordinate.get("xmax"))
            y2 = _to_int(coordinate.get("ymax"))
            return x1, y1, x2, y2
        if {"left", "top", "right", "bottom"} <= keys:
            x1 = _to_int(coordinate.get("left"))
            y1 = _to_int(coordinate.get("top"))
            x2 = _to_int(coordinate.get("right"))
            y2 = _to_int(coordinate.get("bottom"))
            return x1, y1, x2, y2
        if {"x", "y", "w", "h"} <= keys:
            x = _to_int(coordinate.get("x"))
            y = _to_int(coordinate.get("y"))
            w = _to_int(coordinate.get("w"))
            h = _to_int(coordinate.get("h"))
            return x, y, x + max(w, 0), y + max(h, 0)
    elif isinstance(coordinate, (list, tuple)) and len(coordinate) == 4:
        a, b, c, d = (
            _to_int(coordinate[0]),
            _to_int(coordinate[1]),
            _to_int(coordinate[2]),
            _to_int(coordinate[3]),
        )
        # Heuristic: if c>deltas look like width/height, convert to x2,y2
        if c < a or d < b:
            # treat as (x, y, w, h)
            return a, b, a + max(c, 0), b + max(d, 0)
        else:
            # treat as (x1, y1, x2, y2)
            return a, b, c, d
    # Fallback
    return 0, 0, 0, 0


def plot_bounding_box(
    coordinate, img_name, color=(24, 0, 255), label=None, line_thickness=2
):
    img = cv2.imread(img_name)
    if img is None:
        # Image not found or unreadable; safely return
        return
    # Plots one bounding box on image img
    tl = (
        line_thickness or round(0.002 * (img.shape[0] + img.shape[1]) / 2) + 1
    )  # line/font thickness
    x1, y1, x2, y2 = _normalize_bbox(coordinate)
    c1, c2 = (int(x1), int(y1)), (int(x2), int(y2))
    cv2.rectangle(img, c1, c2, color, thickness=tl, lineType=cv2.LINE_AA)
    if label:
        tf = max(tl - 1, 1)  # font thickness
        t_size = cv2.getTextSize(label, 0, fontScale=tl / 3, thickness=tf)[0]
        c2 = c1[0] + t_size[0], c1[1] - t_size[1] - 3
        cv2.rectangle(img, c1, c2, color, -1, cv2.LINE_AA)  # filled
        cv2.putText(
            img,
            label,
            (c1[0], c1[1] - 2),
            0,
            tl / 3,
            [225, 255, 255],
            thickness=tf,
            lineType=cv2.LINE_AA,
        )

    cv2.imwrite(img_name, img)

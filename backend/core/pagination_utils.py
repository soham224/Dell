import math


def get_page_info(total_count: int, page: int, page_size: int) -> dict:
    return {
        "total_page": math.ceil(total_count / page_size),
        "pre_page": page - 1 if page - 1 != 0 else None,
        "next_page": (
            page + 1 if page + 1 <= math.ceil(total_count / page_size) else None
        ),
        "page_size": page_size,
        "total_count": total_count,
    }

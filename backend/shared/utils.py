import time
import functools
import logging
from typing import Any, Dict
from sqlalchemy.orm import Query
import math

logger = logging.getLogger(__name__)


class CacheManager:
    def __init__(self):
        self._cache: Dict[str, tuple[Any, float]] = {}
        self._default_ttl = 300

    def get(self, key: str) -> Any:
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                return value
            else:
                del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: int = None):
        if ttl is None:
            ttl = self._default_ttl
        expiry = time.time() + ttl
        self._cache[key] = (value, expiry)

    def clear(self):
        self._cache.clear()


cache_manager = CacheManager()


def timing_decorator(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = time.time() - start
        logger.info(f"{func.__name__} took {duration:.3f}s")
        return result
    return wrapper


def paginate(query: Query, page: int, page_size: int) -> dict:
    total = query.count()
    total_pages = math.ceil(total / page_size) if page_size > 0 else 0
    
    items = query.limit(page_size).offset((page - 1) * page_size).all()
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

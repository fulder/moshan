from datetime import datetime
from enum import auto
from typing import Optional

from fastapi_utils.enums import StrEnum

from pydantic import BaseModel


class ApiName(StrEnum):
    tmdb = auto()
    tvmaze = auto()
    anidb = auto()


class Status(StrEnum):
    finished = auto()
    following = auto()
    watching = auto()
    dropped = auto()
    backlog = auto()


class Item(BaseModel):
    api_id: str
    api_name: ApiName
    rating: Optional[int]
    overview: Optional[str]
    review: Optional[str]
    dates_watched: Optional[list[datetime]]
    status: Optional[Status]
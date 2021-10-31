from datetime import datetime
from enum import auto
from typing import Optional, List

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


class ReviewData(BaseModel):
    rating: Optional[int]
    overview: Optional[str]
    review: Optional[str]
    dates_watched: Optional[List[datetime]]
    status: Optional[Status]


class PostItem(ReviewData):
    item_api_id: str
    api_name: ApiName


class PostEpisode(ReviewData):
    episode_api_id: str

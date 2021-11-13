from datetime import datetime
from enum import auto
from typing import Optional, List

from fastapi_utils.enums import StrEnum

from pydantic import BaseModel


class ApiName(StrEnum):
    tmdb = auto()
    tvmaze = auto()
    mal = auto()


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


class Sort(StrEnum):
    created_at = auto()


def review_data_to_dict(data: ReviewData):
    data = data.dict(exclude={"api_name", "item_api_id", "episode_api_id"})
    dates = data.get("dates_watched")
    if dates:
        parsed_dates = []
        for d in dates:
            new_d = d.strftime("%Y-%m-%dT%H:%M:%S.%fZ").replace("000Z", "Z")
            parsed_dates.append(new_d)
        data["dates_watched"] = parsed_dates

    return data

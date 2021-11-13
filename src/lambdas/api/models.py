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
    backlog_date = auto()


class Item(BaseModel):
    created_at: str
    update_at: Optional[str]
    deleted_at: Optional[str]
    status: Optional[Status]
    backlog_date: Optional[str]
    latest_watch_date: Optional[str]
    # eps
    ep_count: Optional[int]
    ep_progress: Optional[int]
    watched_eps: Optional[int]
    # specials
    special_count: Optional[int]
    special_progress: Optional[int]
    watched_specials: Optional[int]


class Items(BaseModel):
    items: List[Item]
    end_cursor: Optional[str]


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

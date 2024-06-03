from datetime import datetime
from enum import auto
from typing import List, Optional

from fastapi_utils.enums import CamelStrEnum
from pydantic import BaseModel, ConfigDict


def to_camel(snake_str):
    s = snake_str.split("_")
    return s[0] + "".join(x.title() for x in s[1:])


class Status(CamelStrEnum):
    finished = auto()
    following = auto()
    watching = auto()
    dropped = auto()
    backlog = auto()


class ReviewData(BaseModel):
    rating: Optional[int] = None
    overview: Optional[str] = None
    review: Optional[str] = None
    dates_watched: Optional[List[datetime]] = None
    status: Optional[Status] = None
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ApiNameWithEpisodes(CamelStrEnum):
    tvmaze = auto()
    mal = auto()


class ApiName(CamelStrEnum):
    tmdb = auto()
    tvmaze = auto()
    mal = auto()


class PostItem(ReviewData):
    item_api_id: str
    api_name: ApiName


class PostEpisode(ReviewData):
    episode_api_id: str


class Sort(CamelStrEnum):
    backlog_date = auto()
    ep_progress = auto()
    latest_watch_date = auto()


class Filter(CamelStrEnum):
    in_progress = auto()


class ApiCache(BaseModel):
    special_count: Optional[int] = None
    release_date: Optional[str] = None
    cache_updated: Optional[str] = None
    image_url: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    ep_count: Optional[int] = None
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Review(BaseModel):
    api_name: str
    api_id: str
    created_at: str

    api_cache: Optional[ApiCache] = None

    overview: Optional[str] = None
    review: Optional[str] = None
    status: Optional[Status] = None
    rating: Optional[int] = None

    dates_watched: Optional[List[str]] = None
    updated_at: Optional[str] = None
    deleted_at: Optional[str] = None
    backlog_date: Optional[str] = None
    latest_watch_date: Optional[str] = None
    # eps
    ep_progress: Optional[int] = None
    watched_eps: Optional[int] = None
    # specials
    special_progress: Optional[int] = None
    watched_specials: Optional[int] = None
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class EpisodeReview(Review):
    episode_api_id: str


class Reviews(BaseModel):
    items: List[Review]
    end_cursor: Optional[str] = None
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class EpisodeReviews(BaseModel):
    episodes: List[EpisodeReview]


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

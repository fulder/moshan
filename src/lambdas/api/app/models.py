from datetime import datetime
from enum import auto
from typing import List, Optional

from fastapi_utils.enums import CamelStrEnum
from pydantic import BaseModel


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
    rating: Optional[int]
    overview: Optional[str]
    review: Optional[str]
    dates_watched: Optional[List[datetime]]
    status: Optional[Status]

    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


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


class ApiCache(BaseModel):
    special_count: Optional[int]
    release_date: Optional[str]
    cache_updated: Optional[str]
    image_url: Optional[str]
    title: Optional[str]
    status: Optional[str]
    ep_count: Optional[int]

    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


class Review(BaseModel):
    api_name: str
    api_id: str
    created_at: str

    api_cache: Optional[ApiCache]
    dates_watched: Optional[List[str]]
    updated_at: Optional[str]
    deleted_at: Optional[str]
    status: Optional[Status]
    backlog_date: Optional[str]
    latest_watch_date: Optional[str]
    # eps
    ep_progress: Optional[int]
    watched_eps: Optional[int]
    # specials
    special_progress: Optional[int]
    watched_specials: Optional[int]

    class Config:
        alias_generator = to_camel
        allow_population_by_field_name = True


class EpisodeReview(Review):
    episode_api_id: str


class Reviews(BaseModel):
    items: List[Review]
    end_cursor: Optional[str]


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

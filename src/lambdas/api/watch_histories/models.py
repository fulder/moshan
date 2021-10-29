from enum import Enum

from pydantic import BaseModel


class ApiName(str, Enum):
    tmdb = "tmdb"
    tvmaze = "tvmaze"
    anidb = "anidb"


class AddItem(BaseModel):
    api_id: str
    api_name: ApiName


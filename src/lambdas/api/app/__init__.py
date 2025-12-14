from typing import Optional

import jwt
import reviews_db
import utils
from fastapi import FastAPI, HTTPException, Request
from log import setup_logger
from loguru import logger
from mangum import Mangum
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse, Response

from . import routes
from .models import (
    ApiNameWithEpisodes,
    EpisodeReview,
    EpisodeReviews,
    Filter,
    PostEpisode,
    PostItem,
    Review,
    ReviewData,
    Reviews,
    Sort,
    review_data_to_dict,
)

app = FastAPI()

setup_logger()


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    logger.bind(
        statusCode=exc.status_code,
        detail=exc.detail,
        method=request.method,
        path=request.url.path,
        headers=dict(request.headers),
        queryParams=dict(request.query_params),
        pathParams=dict(request.path_params),
    ).debug("API exception")
    return JSONResponse(str(exc.detail), status_code=exc.status_code)


@app.get("/items", response_model=Reviews, response_model_exclude_none=True)
def get_items(
    request: Request,
    sort: Optional[Sort] = None,
    filter: Optional[Filter] = None,
    cursor: Optional[str] = None,
):
    return routes.get_items(request.state.username, sort, cursor, filter)


@app.get(
    "/items/{api_name}/{item_api_id}",
    response_model=Review,
    response_model_exclude_none=True,
)
def get_item(request: Request, api_name: str, item_api_id: str):
    try:
        return routes.get_item(request.state.username, api_name, item_api_id)
    except reviews_db.NotFoundError:
        raise HTTPException(status_code=404)


@app.delete("/items/{api_name}/{item_api_id}", status_code=204)
def delete_item(request: Request, api_name: str, item_api_id: str):
    routes.delete_item(request.state.username, api_name, item_api_id)


@app.put("/items/{api_name}/{item_api_id}", status_code=204)
def update_item(
    request: Request, api_name: str, item_api_id: str, data: ReviewData
):
    routes.update_item(
        request.state.username,
        api_name,
        item_api_id,
        review_data_to_dict(data),
    )


@app.post("/items", status_code=204)
def add_item(request: Request, item: PostItem):
    try:
        routes.add_item(
            request.state.username,
            item.api_name.value,
            item.item_api_id,
            review_data_to_dict(item),
        )
    except utils.HttpError as e:
        raise HTTPException(status_code=e.code)


@app.get(
    "/items/{api_name}/{item_api_id}/episodes",
    response_model=EpisodeReviews,
    response_model_exclude_none=True,
)
def get_episodes(request: Request, api_name: str, item_api_id: str):
    return routes.get_episodes(
        request.state.username,
        api_name,
        item_api_id,
    )


@app.post("/items/{api_name}/{item_api_id}/episodes", status_code=204)
def add_episode(
    request: Request,
    api_name: ApiNameWithEpisodes,
    item_api_id,
    episode: PostEpisode,
):
    try:
        routes.add_episode(
            request.state.username,
            api_name,
            item_api_id,
            episode.episode_api_id,
            review_data_to_dict(episode),
        )
    except utils.HttpError as e:
        raise HTTPException(status_code=e.code)
    except reviews_db.NotFoundError:
        err_msg = (
            f"Item with api_id: {item_api_id} not found. "
            "Please add the item before posting episode"
        )
        raise HTTPException(status_code=404, detail=err_msg)


@app.get(
    "/items/{api_name}/{item_api_id}/episodes/{episode_api_id}",
    response_model=EpisodeReview,
    response_model_exclude_none=True,
)
def get_episode(
    request: Request, api_name: str, item_api_id: str, episode_api_id: str
):
    try:
        return routes.get_episode(
            request.state.username,
            api_name,
            item_api_id,
            episode_api_id,
        )
    except reviews_db.NotFoundError:
        raise HTTPException(status_code=404)


@app.put(
    "/items/{api_name}/{item_api_id}/episodes/{episode_api_id}",
    status_code=204,
)
def update_episode(
    request: Request,
    api_name: ApiNameWithEpisodes,
    item_api_id: str,
    episode_api_id: str,
    data: ReviewData,
):
    try:
        routes.update_episode(
            request.state.username,
            api_name,
            item_api_id,
            episode_api_id,
            review_data_to_dict(data),
        )
    except utils.HttpError as e:
        raise HTTPException(status_code=e.code)
    except reviews_db.NotFoundError:
        err_msg = (
            f"Item with api_id: {item_api_id} not found. "
            "Please add the item before posting episode"
        )
        raise HTTPException(status_code=404, detail=err_msg)


@app.delete(
    "/items/{api_name}/{item_api_id}/episodes/{episode_api_id}",
    status_code=204,
)
def delete_episode(
    request: Request,
    api_name: ApiNameWithEpisodes,
    item_api_id: str,
    episode_api_id: str,
):
    try:
        routes.delete_episode(
            request.state.username,
            api_name,
            item_api_id,
            episode_api_id,
        )
    except utils.HttpError as e:
        raise HTTPException(status_code=e.code)


@app.middleware("http")
async def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    if auth_header is None:
        return Response(content="Missing Authorization Header", status_code=401)
    decoded = jwt.decode(auth_header, options={"verify_signature": False})
    request.state.username = decoded["username"]
    return await call_next(request)


handler = Mangum(app, api_gateway_base_path="/prod")

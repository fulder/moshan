import os
from typing import Optional

import jwt
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver, Response
from aws_lambda_powertools.event_handler.exceptions import (
    ForbiddenError,
    NotFoundError,
    ServiceError,
)
from pydantic import BaseModel, ValidationError

import reviews_db
import users
import utils
from log import setup_logger

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
    Watches,
    review_data_to_dict,
)

app = APIGatewayHttpResolver(strip_prefixes=["/prod"])

setup_logger()

NOT_FOUND_MSG = (
    "Item with api_id: {} not found. Please add the item before posting episode"
)


class UnprocessableError(ServiceError):
    def __init__(self, msg):
        super().__init__(422, msg)


def _auth(app, next_middleware):
    auth_header = app.current_event.headers.get("authorization")
    if auth_header is None:
        return Response(401, "text/plain", "Missing Authorization Header")
    decoded = jwt.decode(auth_header, options={"verify_signature": False})
    app.append_context(username=decoded["username"])
    return next_middleware(app)


app.use(middlewares=[_auth])


def _username():
    return app.context["username"]


def _query():
    return app.current_event.query_string_parameters or {}


def _is_admin():
    return _username() == os.getenv("ADMIN_USERNAME")


# Every account can view any other one read-only (sign-up is admin-only)
def _read_username():
    return _query().get("user") or _username()


# Watched together: the admin's writes are also copied to this account
def _also_for():
    target = _query().get("alsoFor")
    if not target or target == _username():
        return None
    if not _is_admin():
        raise ForbiddenError("Only the admin can log for others")
    return target


def _body(model):
    try:
        return model.model_validate(app.current_event.json_body or {})
    except ValidationError as e:
        raise UnprocessableError(str(e))


def _enum(enum, value):
    if value is None:
        return None
    try:
        return enum(value)
    except ValueError:
        raise UnprocessableError(f"Invalid value: {value}")


def _dump(model: type[BaseModel], data, exclude_none=True):
    return model.model_validate(data).model_dump(
        mode="json", by_alias=True, exclude_none=exclude_none
    )


def _no_content():
    return Response(204, None, None)


@app.exception_handler(utils.HttpError)
def http_error(e):
    return Response(e.code, "text/plain", str(e))


@app.get("/users")
def get_users():
    return {"users": users.usernames(), "admin": _is_admin()}


@app.get("/items", compress=True)
def get_items():
    query = _query()
    sort: Optional[Sort] = _enum(Sort, query.get("sort"))
    filter: Optional[Filter] = _enum(Filter, query.get("filter"))
    items = routes.get_items(
        _read_username(), sort, query.get("cursor"), filter
    )
    return _dump(Reviews, items)


@app.get("/watches", compress=True)
def get_watches():
    watches = reviews_db.get_watch_dates(_read_username())
    return _dump(Watches, {"watches": watches}, exclude_none=False)


@app.get("/items/<api_name>/<item_api_id>")
def get_item(api_name, item_api_id):
    try:
        item = routes.get_item(_read_username(), api_name, item_api_id)
    except reviews_db.NotFoundError:
        raise NotFoundError("Not Found")
    return _dump(Review, item)


@app.delete("/items/<api_name>/<item_api_id>")
def delete_item(api_name, item_api_id):
    routes.delete_item(_username(), api_name, item_api_id)
    return _no_content()


@app.put("/items/<api_name>/<item_api_id>")
def update_item(api_name, item_api_id):
    data = review_data_to_dict(_body(ReviewData))
    also_for = _also_for()
    routes.update_item(_username(), api_name, item_api_id, dict(data))
    if also_for:
        routes.mirror_item(
            also_for, api_name, item_api_id, data.get("dates_watched")
        )
    return _no_content()


@app.post("/items")
def add_item():
    item = _body(PostItem)
    data = review_data_to_dict(item)
    also_for = _also_for()
    routes.add_item(
        _username(),
        item.api_name.value,
        item.item_api_id,
        dict(data),
    )
    if also_for:
        routes.mirror_item(
            also_for,
            item.api_name.value,
            item.item_api_id,
            data.get("dates_watched"),
        )
    return _no_content()


@app.get("/items/<api_name>/<item_api_id>/episodes", compress=True)
def get_episodes(api_name, item_api_id):
    episodes = routes.get_episodes(_read_username(), api_name, item_api_id)
    return _dump(EpisodeReviews, episodes)


@app.post("/items/<api_name>/<item_api_id>/episodes")
def add_episode(api_name, item_api_id):
    api_name = _enum(ApiNameWithEpisodes, api_name)
    episode = _body(PostEpisode)
    data = review_data_to_dict(episode)
    also_for = _also_for()
    try:
        routes.add_episode(
            _username(),
            api_name.value,
            item_api_id,
            episode.episode_api_id,
            dict(data),
        )
    except reviews_db.NotFoundError:
        raise NotFoundError(NOT_FOUND_MSG.format(item_api_id))
    if also_for:
        routes.mirror_episode(
            also_for,
            api_name.value,
            item_api_id,
            episode.episode_api_id,
            data.get("dates_watched"),
        )
    return _no_content()


@app.get("/items/<api_name>/<item_api_id>/episodes/<episode_api_id>")
def get_episode(api_name, item_api_id, episode_api_id):
    try:
        episode = routes.get_episode(
            _read_username(), api_name, item_api_id, episode_api_id
        )
    except reviews_db.NotFoundError:
        raise NotFoundError("Not Found")
    return _dump(EpisodeReview, episode)


@app.put("/items/<api_name>/<item_api_id>/episodes/<episode_api_id>")
def update_episode(api_name, item_api_id, episode_api_id):
    api_name = _enum(ApiNameWithEpisodes, api_name)
    data = review_data_to_dict(_body(ReviewData))
    also_for = _also_for()
    try:
        routes.update_episode(
            _username(),
            api_name.value,
            item_api_id,
            episode_api_id,
            dict(data),
        )
    except reviews_db.NotFoundError:
        raise NotFoundError(NOT_FOUND_MSG.format(item_api_id))
    if also_for:
        routes.mirror_episode(
            also_for,
            api_name.value,
            item_api_id,
            episode_api_id,
            data.get("dates_watched"),
        )
    return _no_content()


@app.delete("/items/<api_name>/<item_api_id>/episodes/<episode_api_id>")
def delete_episode(api_name, item_api_id, episode_api_id):
    api_name = _enum(ApiNameWithEpisodes, api_name)
    also_for = _also_for()
    routes.delete_episode(
        _username(), api_name.value, item_api_id, episode_api_id
    )
    if also_for:
        routes.mirror_delete_episode(
            also_for, api_name.value, item_api_id, episode_api_id
        )
    return _no_content()


def handler(event, context):
    return app.resolve(event, context)

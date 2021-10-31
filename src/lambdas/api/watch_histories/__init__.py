from fastapi import FastAPI, Request
from mangum import Mangum

import routes
import jwt_utils
from models import Item, PostItem

app = FastAPI()


@app.get("/watch-histories/item/{api_name}/{item_api_id}")
def get_item(request: Request, api_name: str, item_api_id: str):
    return routes.get_item(request.state.username, api_name, item_api_id)


@app.delete("/watch-histories/item/{api_name}/{item_api_id}", status_code=204)
def delete_item(request: Request, api_name: str, item_api_id: str):
    return routes.delete_item(request.state.username, api_name, item_api_id)


@app.put("/watch-histories/item/{api_name}/{item_api_id}", status_code=204)
def update_item(request: Request, api_name: str, item_api_id: str, item: Item):
    return routes.update_item(
        request.state.username,
        api_name,
        item_api_id,
        item.dict(),
    )


@app.post("/watch-histories/item", status_code=204)
def add_item(request: Request, item: PostItem):
    d = item.dict(exclude={"api_name", "item_api_id"})
    return routes.add_item(
        request.state.username,
        item.api_name,
        item.item_api_id,
        d,
    )


@app.get("/watch-histories/item/{api_name}/{item_api_id}/episodes")
def get_episodes(request: Request, api_name: str, item_api_id: str):
    return routes.get_episodes(
        request.state.username,
        api_name,
        item_api_id,
    )


@app.get(
    "/watch-histories/item/{api_name}/{item_api_id}/episodes/{episode_api_id}")
def get_episode(request: Request, api_name: str, item_api_id: str,
                episode_api_id: str):
    return routes.get_episode(
        request.state.username,
        api_name,
        item_api_id,
        episode_api_id,
    )


@app.middleware("http")
def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    request.state.username = jwt_utils.get_username(auth_header)
    return call_next(request)


handle = Mangum(app, api_gateway_base_path="/prod")

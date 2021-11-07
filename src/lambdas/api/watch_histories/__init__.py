import jwt
from fastapi import FastAPI, Request
from mangum import Mangum

import routes
from models import PostItem, PostEpisode, ReviewData, review_data_to_dict

app = FastAPI()


@app.get("/watch-histories/items/{api_name}/{item_api_id}")
def get_item(request: Request, api_name: str, item_api_id: str):
    return routes.get_item(request.state.username, api_name, item_api_id)


@app.delete("/watch-histories/items/{api_name}/{item_api_id}", status_code=204)
def delete_item(request: Request, api_name: str, item_api_id: str):
    routes.delete_item(request.state.username, api_name, item_api_id)


@app.put("/watch-histories/items/{api_name}/{item_api_id}", status_code=204)
def update_item(request: Request, api_name: str, item_api_id: str,
                data: ReviewData):
    routes.update_item(
        request.state.username,
        api_name,
        item_api_id,
        review_data_to_dict(data),
    )


@app.post("/watch-histories/items", status_code=204)
def add_item(request: Request, item: PostItem):
    routes.add_item(
        request.state.username,
        item.api_name,
        item.item_api_id,
        review_data_to_dict(item),
    )


@app.get("/watch-histories/items/{api_name}/{item_api_id}/episodes")
def get_episodes(request: Request, api_name: str, item_api_id: str):
    return routes.get_episodes(
        request.state.username,
        api_name,
        item_api_id,
    )


@app.post("/watch-histories/items/{api_name}/{item_api_id}/episodes",
          status_code=204)
def add_episode(request: Request, api_name, item_api_id, episode: PostEpisode):
    routes.add_episode(
        request.state.username,
        api_name,
        item_api_id,
        episode.episode_api_id,
        review_data_to_dict(episode),
    )


@app.get(
    "/watch-histories/items/{api_name}/{item_api_id}/episodes/{episode_api_id}")
def get_episode(request: Request, api_name: str, item_api_id: str,
                episode_api_id: str):
    return routes.get_episode(
        request.state.username,
        api_name,
        item_api_id,
        episode_api_id,
    )


@app.put(
    "/watch-histories/items/{api_name}/{item_api_id}/episodes/{episode_api_id}",
    status_code=204)
def update_episode(request: Request, api_name: str, item_api_id: str,
                   episode_api_id: str, data: ReviewData):
    routes.update_episode(
        request.state.username,
        api_name,
        item_api_id,
        episode_api_id,
        review_data_to_dict(data),
    )


@app.delete(
    "/watch-histories/items/{api_name}/{item_api_id}/episodes/{episode_api_id}",
    status_code=204)
def delete_episode(request: Request, api_name: str, item_api_id: str,
                   episode_api_id: str):
    routes.delete_episode(
        request.state.username,
        api_name,
        item_api_id,
        episode_api_id,
    )


@app.middleware("http")
def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    decoded = jwt.decode(auth_header, options={"verify_signature": False})
    request.state.username = decoded["username"]
    return call_next(request)


handler = Mangum(app, api_gateway_base_path="/prod")

from fastapi import FastAPI, Request
from mangum import Mangum

import routes
import jwt_utils
from models import Item

app = FastAPI()


@app.get("/watch-histories/item/{api_name}/{api_id}")
def get_item(request: Request, api_name: str, api_id: str):
    return routes.get_item(request.state.username, api_name, api_id)


@app.delete("/watch-histories/item/{api_name}/{api_id}", status_code=204)
def delete_item(request: Request, api_name: str, api_id: str):
    return routes.delete_item(request.state.username, api_name, api_id)


@app.post("/watch-histories/item", status_code=204)
def add_item(request: Request, item: Item):
    d = item.dict(exclude={"api_name", "api_id"})
    return routes.add_item(
        request.state.username,
        item.api_name,
        item.api_id,
        d,
    )


@app.middleware("http")
def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    request.state.username = jwt_utils.get_username(auth_header)
    return call_next(request)


handle = Mangum(app, api_gateway_base_path="/prod")

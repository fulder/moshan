from fastapi import FastAPI, Request
from mangum import Mangum

import api
import jwt_utils
from models import AddItem

app = FastAPI()


@app.get("/watch-histories/item")
def get_item(request: Request, api_name: str, api_id: str):
    return api.get_item(request.state.username, api_name, api_id)


@app.post("/watch-histories/item", status_code=204)
def add_item(request: Request, item: AddItem):
    return api.add_item(request.state.username, item.api_name, item.api_id)


@app.middleware("http")
def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    jwt_str = auth_header.split("Bearer ")[1]
    request.state.username = jwt_utils.get_username(jwt_str)
    return call_next(request)


handle = Mangum(app, api_gateway_base_path="/prod/")

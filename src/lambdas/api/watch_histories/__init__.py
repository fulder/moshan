from fastapi import FastAPI, Request
from mangum import Mangum

import api
import jwt_utils

app = FastAPI()


@app.get("/watch-histories/item")
def item(request: Request, api_name: str, api_id: str):
    return api.get_item(request.state.username, api_name, api_id)


@app.middleware("http")
def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    jwt_str = auth_header.split("Bearer ")[1]
    request.state.username = jwt_utils.get_username(jwt_str)
    return call_next


handle = Mangum(app, api_gateway_base_path="/prod/")

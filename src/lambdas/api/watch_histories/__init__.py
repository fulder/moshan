from fastapi import FastAPI, Request
from mangum import Mangum

from . import api
import jwt_utils

app = FastAPI()


@app.get("/watch-histories/item")
def item(api_name: str, api_id: str):
    return api.get_item(api_name, api_id)


@app.middleware("http")
def parse_token(request: Request, call_next):
    username = jwt_utils.get_username(request.headers.get("authorization"))
    request.state.username = username
    return call_next


handle = Mangum(app, api_gateway_base_path="/prod/")

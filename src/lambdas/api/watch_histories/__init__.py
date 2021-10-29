from starlette.middleware.cors import CORSMiddleware

from fastapi import FastAPI, Request
from mangum import Mangum

import api
import jwt_utils
from models import Item

app = FastAPI()

origins = [
    "https://moshan.tv",
    "https://beta.moshan.tv",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["authorization", "content-type"],
)


@app.get("/watch-histories/item")
def get_item(request: Request, api_name: str, api_id: str):
    return api.get_item(request.state.username, api_name, api_id)


@app.post("/watch-histories/item", status_code=204)
def add_item(request: Request, item: Item):
    d = item.dict(exclude={"api_name", "api_id"})
    return api.add_item(request.state.username, item.api_name, item.api_id, d)


@app.middleware("http")
def parse_token(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    jwt_str = auth_header.split("Bearer ")[1]
    request.state.username = jwt_utils.get_username(jwt_str)
    return call_next(request)


handle = Mangum(app, api_gateway_base_path="/prod/")

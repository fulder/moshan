#!/usr/bin/env python3
import os

from aws_cdk import core

from lib.utils import clean_pycache
from lib.watch_history import WatchHistory

clean_pycache()

app = core.App()

env = {"region": "eu-west-1"}

anime_api_url = os.getenv("ANIME_API_URL")
if anime_api_url is None:
    raise RuntimeError("Please set the ANIME_API_URL environment variable")

domain_name = "api.watch-history.moshan.tv"

WatchHistory(app, "watch-history", anime_api_url, domain_name, env=env)

app.synth()

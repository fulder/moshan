#!/usr/bin/env python3
import os

from aws_cdk import core

from lib.utils import clean_pycache
from lib.watch_history import WatchHistory

clean_pycache()

app = core.App()

env = {"region": "eu-west-1"}

anime_api_url = "https://api.anime.moshan.tv"
domain_name = "api.watch-history.moshan.tv"

WatchHistory(app, "watch-history", anime_api_url, domain_name, env=env)

app.synth()

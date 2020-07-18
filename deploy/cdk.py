#!/usr/bin/env python3
from aws_cdk import core

from lib.watch_history import WatchHistory
from lib.utils import clean_pycache

clean_pycache()

app = core.App()

env = {"region": "eu-west-1"}

WatchHistory(app, "watch-history", env=env)

app.synth()

import os

import boto3
import requests
from dynamodb_json import json_util

client = boto3.client("dynamodb")
resource = boto3.resource("dynamodb")

EPISODES_TABLE_NAME = "watch-history-episodes"
TOKEN = os.getenv("TOKEN")

table = resource.Table(EPISODES_TABLE_NAME)
paginator = client.get_paginator('scan')

for page in paginator.paginate(TableName=EPISODES_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)

        if item["collection_name"] == "show" and ("item_id" not in item or item["item_id"] == "null"):
            print(f"Current item: {item}")

            tvmaze_ep_id = item["id"]
            res = requests.get(f"http://api.tvmaze.com/episodes/{tvmaze_ep_id}?embed=show")
            tvmaze_show_id = res.json()["_embedded"]["show"]["id"]

            d = {
                "api_id": str(tvmaze_show_id),
                "api_name": "tvmaze",
            }
            ret = requests.post(f"https://api.show.moshan.tv/shows", json=d,
                headers={"Authorization": TOKEN})

            show_id = ret.json()["id"]
            item["item_id"] = show_id
            print(f"Put item: {item}")

            table.put_item(Item=item)




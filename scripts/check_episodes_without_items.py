import os

import boto3
import requests
from dynamodb_json import json_util

client = boto3.client("dynamodb")
resource = boto3.resource("dynamodb")

EPISODES_TABLE_NAME = "watch-history-episodes"
ITEMS_TABLE_NAME = "watch-history-items"

TOKEN = os.getenv("TOKEN")

table = resource.Table(EPISODES_TABLE_NAME)
item_table = resource.Table(ITEMS_TABLE_NAME)
paginator = client.get_paginator('scan')

ids = []
for page in paginator.paginate(TableName=EPISODES_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)

        if item["collection_name"] == "show":
            show_id = item["item_id"]

            i = item_table.get_item(
                Key={
                    "username": item["username"],
                    "item_id": show_id
                }
            )

            if "Item" not in i and show_id not in ids:
                ret = requests.get(
                    f"https://api.show.moshan.tv/shows/{show_id}",
                    headers={"Authorization": TOKEN})
                print(ret.json()["tvmaze_id"])
                ids.append(show_id)

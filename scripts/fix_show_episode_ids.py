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

        if item["collection_name"] == "show":
            try:
                int(item["id"])
            except ValueError:
                print(f"Item has correct show episode UUID: {item['id']}")
                print(item)
                continue

            show_id = item["item_id"]
            d = {
                "api_id": item["id"],
                "api_name": "tvmaze"
            }

            print(f"Show id: {show_id}")
            ret = requests.post(f"https://api.show.moshan.tv/shows/{show_id}/episodes", json=d, headers={"Authorization": TOKEN})
            if ret.status_code != 200:
                raise Exception(f"Invalid status code from post show ep: {ret.status_code}. Text: {ret.text}")

            item["id"] = ret.json()["id"]
            print(f"Put item: {item}")

            table.put_item(Item=item)

            k = {
                "username": item["username"],
                "id": d["api_id"],
            }
            print(f"Delete item with key: {k}")

            table.delete_item(Key={
                 "username": item["username"],
                 "id": d["api_id"],
            })





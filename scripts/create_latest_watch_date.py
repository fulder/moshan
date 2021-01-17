import boto3
import dateutil.parser
from dynamodb_json import json_util

client = boto3.client("dynamodb")
resource = boto3.resource("dynamodb")

ITEMS_TABLE_NAME = "watch-history-items"
EPISODES_TABLE_NAME = "watch-history-episodes"

paginator = client.get_paginator('scan')

for page in paginator.paginate(TableName=ITEMS_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)
        if "dates_watched" in item:
            latest_date = None

            for watch_date in item["dates_watched"]:
                next_date = dateutil.parser.parse(watch_date)
                if latest_date is None or next_date > latest_date:
                    latest_date = next_date
                    item["latest_watch_date"] = watch_date

        print(item)
        resource.Table(ITEMS_TABLE_NAME).put_item(Item=item)

for page in paginator.paginate(TableName=EPISODES_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)
        if "dates_watched" in item:
            latest_date = None

            for watch_date in item["dates_watched"]:
                next_date = dateutil.parser.parse(watch_date)
                if latest_date is None or next_date > latest_date:
                    latest_date = next_date
                    item["latest_watch_date"] = watch_date

        print(item)
        resource.Table(EPISODES_TABLE_NAME).put_item(Item=item)



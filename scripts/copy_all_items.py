import sys

import boto3
from boto3.dynamodb.conditions import Key
from dynamodb_json import json_util

client = boto3.client("dynamodb")
resource = boto3.resource("dynamodb")

OLD_ITEMS_TABLE_NAME = "watch-history-items"
OLD_EPISODES_TABLE_NAME = "watch-history-episodes"

NEW_REVIEWS_TABLE = resource.Table("reviews")

paginator = client.get_paginator('scan')

# for page in paginator.paginate(TableName=OLD_ITEMS_TABLE_NAME):
#     for i in page["Items"]:
#         item = json_util.loads(i)
#
#         if "api_info" not in item:
#             print(item)
#
#         item["api_info"] = f"i_{item['api_info']}"
#
#         try:
#             del item["item_id"]
#         except KeyError:
#             pass
#
#         try:
#             del item["collection_name"]
#         except KeyError:
#             pass
#
#         print(item)
#         NEW_REVIEWS_TABLE.put_item(Item=item)


# res = NEW_REVIEWS_TABLE.query(
#     KeyConditionExpression=Key("username").eq("asia") & Key("api_info").begins_with("e_")
# )
#
# for i in res["Items"]:
#     print(i)
#     NEW_REVIEWS_TABLE.delete_item(
#         Key={
#             "username": "asia",
#             "api_info": i["api_info"],
#         }
#     )


for page in paginator.paginate(TableName=OLD_EPISODES_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)

        if "api_info" not in item:
            print(item)

        try:
            del item["id"]
        except KeyError:
            pass

        try:
            del item["item_id"]
        except KeyError:
            pass

        try:
            del item["collection_name"]
        except KeyError:
            pass

        item["api_info"] = f"e_{item['api_info']}"
        print(item)

        NEW_REVIEWS_TABLE.put_item(Item=item)

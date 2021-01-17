import boto3
from dynamodb_json import json_util

client = boto3.client("dynamodb")
resource = boto3.resource("dynamodb")

OLD_ITEMS_TABLE_NAME = "watch-history-watchhistoryC6E1702F-9FP7GUOWK92O"
#NEW_ITEMS_TABLE = resource.Table("watch-history-items")
NEW_ITEMS_TABLE = resource.Table("watch-history-watchhistoryC6E1702F-1PO8A1UNXFW1N")

OLD_EPISODES_TABLE_NAME = "watch-history-episodesDCA28D60-61TCY1BLHGRJ"
#NEW_EPISODES_TABLE = resource.Table("watch-history-episodes")
NEW_EPISODES_TABLE = resource.Table("watch-history-episodesDCA28D60-1WD5J6YDTZY98")


paginator = client.get_paginator('scan')

for page in paginator.paginate(TableName=OLD_ITEMS_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)
        print(item)
        NEW_ITEMS_TABLE.put_item(Item=item)


for page in paginator.paginate(TableName=OLD_EPISODES_TABLE_NAME):
    for i in page["Items"]:
        item = json_util.loads(i)
        print(item)
        NEW_EPISODES_TABLE.put_item(Item=item)



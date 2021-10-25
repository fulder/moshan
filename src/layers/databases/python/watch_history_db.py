import os
import time
from datetime import datetime

import boto3
import dateutil.parser
from boto3.dynamodb.conditions import Key, Attr
from dynamodb_json import json_util

import logger

DATABASE_NAME = os.getenv("DATABASE_NAME")
OPTIONAL_FIELDS = [
    "deleted_at",
    "overview",
    "review",
    "status",
    "rating",
    "dates_watched",
]

table = None
client = None

log = logger.get_logger(__name__)


class Error(Exception):
    pass


class NotFoundError(Error):
    pass


class InvalidStartOffset(Error):
    pass


def _get_table():
    global table
    if table is None:
        table = boto3.resource("dynamodb").Table(DATABASE_NAME)
    return table


def _get_client():
    global client
    if client is None:
        client = boto3.client("dynamodb")
    return client


def add_item(username, collection_name, item_id, data=None):
    if data is None:
        data = {}

    if "dates_watched" not in data:
        data["latest_watch_date"] = "0"
    try:
        get_item(username, collection_name, item_id, include_deleted=True)
    except NotFoundError:
        data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    update_item(username, collection_name, item_id, data,
                clean_whitelist=["deleted_at"])


def delete_item(username, collection_name, item_id):
    data = {"deleted_at": int(time.time())}
    update_item(username, collection_name, item_id, data, clean_whitelist=[])


def get_item(username, collection_name, item_id, include_deleted=False):
    filter_exp = Attr("collection_name").eq(collection_name)
    if not include_deleted:
        filter_exp &= Attr("deleted_at").not_exists()

    res = _get_table().query(
        KeyConditionExpression=Key("username").eq(username) & Key("item_id").eq(
            item_id),
        FilterExpression=filter_exp,
    )

    if not res["Items"]:
        raise NotFoundError(
            f"Item with id: {item_id} not found. Collection name: {collection_name}")

    return res["Items"][0]


def update_item(username, collection_name, item_id, data,
                clean_whitelist=OPTIONAL_FIELDS):
    data["collection_name"] = collection_name
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if "dates_watched" in data:
        m_d = max([dateutil.parser.parse(d) for d in data["dates_watched"]])
        m_d = m_d.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        data["latest_watch_date"] = m_d.replace("000Z", "Z")

    items = ','.join(f'#{k}=:{k}' for k in data)
    update_expression = f"SET {items}"
    expression_attribute_names = {f'#{k}': k for k in data}
    expression_attribute_values = {f':{k}': v for k, v in data.items()}

    remove_names = []
    for o in OPTIONAL_FIELDS:
        if o not in data and o in clean_whitelist:
            remove_names.append(f"#{o}")
            expression_attribute_names[f"#{o}"] = o
    if len(remove_names) > 0:
        update_expression += f" REMOVE {','.join(remove_names)}"

    log.debug("Running update_item")
    log.debug(f"Update expression: {update_expression}")
    log.debug(f"Expression attribute names: {expression_attribute_names}")
    log.debug(f"Expression attribute values: {expression_attribute_values}")
    log.debug(f"Client ID: {username}")

    _get_table().update_item(
        Key={
            "username": username,
            "item_id": item_id,
        },
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )


def change_watched_eps(username, collection_name, item_id, change, special=False):
    field_name = "ep"
    if special:
        field_name = "special"

    item = get_item(username, collection_name, item_id)
    if item[f"{field_name}_count"] == 0:
        ep_progress = 0
    else:
        ep_progress = (item[f"watched_{field_name}s"] + (change)) / item[f"{field_name}_count"]
    ep_progress = str(round(ep_progress * 100, 2))

    _get_table().update_item(
        Key={
            "username": username,
            "item_id": item_id,
        },
        UpdateExpression="SET #w=#w+:i, #p=:p",
        ExpressionAttributeNames={
            "#w": f"watched_{field_name}s",
            "#e": f"{field_name}_progress",
        },
        ExpressionAttributeValues={
            ":p": ep_progress,
            ":i": change,
        }
    )


def get_watch_history(username, collection_name=None,
                      index_name=None, status_filter=None):
    paginator = _get_client().get_paginator('query')

    query_kwargs = {
        "TableName": DATABASE_NAME,
        "KeyConditionExpression": "username = :username",
        "ExpressionAttributeValues": {
            ":username": {"S": username}
        },
        "ScanIndexForward": False,
        "FilterExpression": "attribute_not_exists(deleted_at)"
    }

    if index_name is not None:
        query_kwargs["IndexName"] = index_name
    if collection_name is not None:
        collection_filter = " and collection_name = :collection_name"
        query_kwargs["FilterExpression"] += collection_filter
        query_kwargs["ExpressionAttributeValues"][":collection_name"] = {
            "S": collection_name
        }
    if status_filter is not None:
        st_filter = " and #status = :status"
        query_kwargs["FilterExpression"] += st_filter
        query_kwargs["ExpressionAttributeNames"] = {
            "#status": "status",
        }
        query_kwargs["ExpressionAttributeValues"][":status"] = {
            "S": status_filter
        }

    log.debug(f"Query kwargs: {query_kwargs}")

    page_iterator = paginator.paginate(**query_kwargs)

    res = []
    for p in page_iterator:
        for i in p["Items"]:
            i = json_util.loads(i)
            res.append(i)
    return res


def get_items_by_id(item_id):
    res = _get_table().query(
        IndexName="item_id",
        KeyConditionExpression=Key("item_id").eq(item_id),
    )

    if not res["Items"]:
        raise NotFoundError(f"Item with id: {item_id} not found.")

    return res["Items"]


def put_item(item):
    _get_table().put_item(
        Item=item,
    )

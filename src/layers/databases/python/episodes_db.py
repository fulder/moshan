import os
import time
from datetime import datetime

import boto3
import dateutil.parser
from boto3.dynamodb.conditions import Key, Attr
from dynamodb_json import json_util

import logger

DATABASE_NAME = os.getenv("EPISODES_DATABASE_NAME")
OPTIONAL_FIELDS = [
    "deleted_at",
    "overview",
    "review",
    "rating",
    "dates_watched"
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


def add_episode(username, collection_name, item_id, episode_id, data=None):
    if data is None:
        data = {}

    data["item_id"] = item_id
    try:
        get_episode(username, collection_name, episode_id, include_deleted=True)
    except NotFoundError:
        data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    update_episode(username, collection_name, episode_id, data,
                   clean_whitelist=["deleted_at"])


def delete_episode(username, collection_name, episode_id):
    data = {"deleted_at": int(time.time())}
    update_episode(username, collection_name, episode_id, data,
                   clean_whitelist=[])


def get_episode(username, collection_name, episode_id, include_deleted=False):
    filter_exp = Attr("collection_name").eq(collection_name)
    if not include_deleted:
        filter_exp &= Attr("deleted_at").not_exists()

    res = _get_table().query(
        KeyConditionExpression=Key("username").eq(username) & Key("id").eq(
            episode_id),
        FilterExpression=filter_exp,
    )

    if not res["Items"]:
        raise NotFoundError(
            f"Episode with id: {episode_id} not found. Collection name: {collection_name}")

    return res["Items"][0]


def get_episode_by_api_id(username, api_name, api_id, include_deleted=False):
    api_info = f"{api_name}_{api_id}"

    kwargs = {
        "IndexName": "api_info",
        "KeyConditionExpression": Key("username").eq(username) &
                                  Key("api_info").eq(api_info)
    }
    if not include_deleted:
        kwargs["FilterExpression"] = Attr("deleted_at").not_exists()

    res = _get_table().query(**kwargs)

    if not res["Items"]:
        raise NotFoundError(
            f"Episode with api id: {api_id} not found. Api name: {api_name}")

    return res["Items"][0]


def update_episode(username, collection_name, episode_id, data,
                   clean_whitelist=OPTIONAL_FIELDS):
    data["collection_name"] = collection_name
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if "dates_watched" in data:
        data["latest_watch_date"] = max(data["dates_watched"])

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
            "id": episode_id,
        },
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )


def get_episodes(username, api_name, item_api_id):
    item_api_info = f"{api_name}_{item_api_id}"

    paginator = _get_client().get_paginator('query')

    query_kwargs = {
        "TableName": DATABASE_NAME,
        "IndexName": "item_api_info",
        "KeyConditionExpression": "username = :username",
        "ExpressionAttributeValues": {
            ":username": {"S": username},
            ":item_api_info": {"S": item_api_info},
        },
        "ScanIndexForward": False,
        "FilterExpression": "attribute_not_exists(deleted_at) and item_api_info = :item_api_info",
    }

    log.debug(f"Query kwargs: {query_kwargs}")

    page_iterator = paginator.paginate(**query_kwargs)

    res = []
    for p in page_iterator:
        for i in p["Items"]:
            i = json_util.loads(i)
            res.append(i)
    return res

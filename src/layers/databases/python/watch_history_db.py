import os
import time
from datetime import datetime

import boto3
from boto3.dynamodb.conditions import Key, Attr
from dynamodb_json import json_util

import logger

DATABASE_NAME = os.getenv("DATABASE_NAME")

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


def add_item(client_id, collection_name, item_id):
    data = {
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    update_item(client_id, collection_name, item_id, data)


def delete_item(client_id, collection_name, item_id):
    data = {"deleted_at": int(time.time())}
    update_item(client_id, collection_name, item_id, data)


def get_item(client_id, collection_name, item_id):
    res = _get_table().query(
        KeyConditionExpression=Key("client_id").eq(client_id) & Key("item_id").eq(item_id),
        FilterExpression=Attr("collection_name").eq(collection_name)
    )

    if not res["Items"]:
        raise NotFoundError(f"Item with id: {item_id} not found. Collection name: {collection_name}")

    return res["Items"][0]


def update_item(client_id, collection_name, item_id, data):
    data["item_id"] = item_id
    data["collection_name"] = collection_name
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if "deleted_at" not in data:
        data["deleted_at"] = None

    items = ','.join(f'#{k}=:{k}' for k in data)
    update_expression = f"SET {items}"
    expression_attribute_names = {f'#{k}': k for k in data}
    expression_attribute_values = {f':{k}': v for k, v in data.items()}

    log.debug("Running update_item")
    log.debug(f"Update expression: {update_expression}")
    log.debug(f"Expression attribute names: {expression_attribute_names}")
    log.debug(f"Expression attribute values: {expression_attribute_values}")

    _get_table().update_item(
        Key={"client_id": client_id},
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )


def get_watch_history(client_id, collection_name=None, index_name=None, limit=100, start=1):
    start_page = 0
    res = []

    if start <= 0:
        raise InvalidStartOffset

    total_pages = 0
    for p in _watch_history_generator(client_id, limit=limit, collection_name=collection_name, index_name=index_name):
        total_pages += 1
        start_page += 1
        if start_page == start:
            res = p

    if start > start_page:
        raise InvalidStartOffset

    log.debug(f"get_episodes response: {res}")

    if not res:
        raise NotFoundError(
            f"Watch history for client with id: {client_id} and collection: {collection_name} not found")

    return {
        "items": res,
        "total_pages": total_pages
    }


def _watch_history_generator(client_id, limit, collection_name=None, index_name=None):
    paginator = _get_client().get_paginator('query')

    query_kwargs = {
        "TableName": DATABASE_NAME,
        "KeyConditionExpression": "client_id = :client_id",
        "ExpressionAttributeValues": {
            ":client_id": {"S": client_id}
        },
        "Limit": limit,
        "ScanIndexForward": False
    }

    if index_name:
        query_kwargs["IndexName"] = index_name
    if collection_name:
        query_kwargs["FilterExpression"] = "collection_name = :collection_name"
        query_kwargs["ExpressionAttributeValues"][":collection_name"] = {"S": collection_name}

    log.debug(f"Query kwargs: {query_kwargs}")

    page_iterator = paginator.paginate(**query_kwargs)

    for p in page_iterator:
        items = []
        for i in p["Items"]:
            items.append(json_util.loads(i))
        yield items

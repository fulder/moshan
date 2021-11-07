import os
import time
import uuid
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


def add_item_v2(username, api_name, api_id, data=None):
    if data is None:
        data = {}
    data["api_info"] = f"{api_name}_{api_id}"

    if data.get("dates_watched"):
        data["latest_watch_date"] = "0"
    try:
        get_item_by_api_id(
            username,
            api_name,
            api_id,
            include_deleted=True,
        )
    except NotFoundError:
        data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # create legacy item properties
    collection_name, item_id = get_collection_and_item_id(api_name, api_id)
    update_item(
        username,
        collection_name,
        item_id,
        data,
        clean_whitelist=["deleted_at"],
    )


def update_item_v2(username, api_name, api_id, data,
                   clean_whitelist=OPTIONAL_FIELDS):
    collection_name, item_id = get_collection_and_item_id(api_name, api_id)
    update_item(
        username,
        collection_name,
        item_id,
        data,
        clean_whitelist=clean_whitelist,
    )


def get_collection_and_item_id(api_name, api_id):
    if api_name == "tmdb":
        movie_namespace = uuid.UUID("9c5bbb4a-5fef-4d16-917b-537421aabfa6")
        api_uuid = uuid.uuid5(movie_namespace, api_name)
        return "movie", str(uuid.uuid5(api_uuid, api_id))

    if api_name == "tvmaze":
        show_namespace = uuid.UUID("6045673a-9dd2-451c-aa58-d94a217b993a")
        api_uuid = uuid.uuid5(show_namespace, api_name)
        return "show", str(uuid.uuid5(api_uuid, api_id))

    if api_name == "mal":
        anime_namespace = uuid.UUID("e27bf9e0-e54a-4260-bcdc-7baad9a3c36b")
        api_uuid = uuid.uuid5(anime_namespace, api_name)
        return "anime", str(uuid.uuid5(api_uuid, api_id))


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


def delete_item_v2(username, api_name, api_id):
    collection_name, item_id = get_collection_and_item_id(api_name, api_id)
    delete_item(
        username,
        collection_name,
        item_id,
    )


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


def get_item_by_api_id(username, api_name, api_id, include_deleted=False):
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
        raise NotFoundError(f"Item with api_info: {api_info} not found")

    return res["Items"][0]


def get_items_by_api_id(api_name, api_id):
    api_info = f"{api_name}_{api_id}"
    res = _get_table().query(
        IndexName="all_api_info",
        KeyConditionExpression=Key("api_info").eq(api_info),
    )

    if not res["Items"]:
        raise NotFoundError(f"Item with api_info: {api_info} not found.")

    return res["Items"]


def update_item(username, collection_name, item_id, data,
                clean_whitelist=OPTIONAL_FIELDS):
    data["collection_name"] = collection_name
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if data.get("dates_watched"):
        m_d = max([dateutil.parser.parse(d) for d in data["dates_watched"]])
        m_d = m_d.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        data["latest_watch_date"] = m_d.replace("000Z", "Z")

    update_expression = "SET "
    expression_attribute_names = {}
    expression_attribute_values = {}
    for k, v in data.items():
        if v is None:
            continue

        update_expression += f"#{k}=:{k},"
        expression_attribute_names[f"#{k}"] = k
        expression_attribute_values[f":{k}"] = v

    # remove last comma
    update_expression = update_expression[:-1]

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


def change_watched_eps(username, collection_name, item_id, change,
                       special=False):
    field_name = "ep"
    if special:
        field_name = "special"

    item = get_item(username, collection_name, item_id)
    if f"{field_name}_count" not in item or item[f"{field_name}_count"] == 0:
        ep_progress = 0
    else:
        ep_progress = (item[f"watched_{field_name}s"] + (change)) / item[
            f"{field_name}_count"]
    ep_progress = round(ep_progress * 100, 2)

    _get_table().update_item(
        Key={
            "username": username,
            "item_id": item_id,
        },
        UpdateExpression="SET #w=#w+:i, #p=:p",
        ExpressionAttributeNames={
            "#w": f"watched_{field_name}s",
            "#p": f"{field_name}_progress",
        },
        ExpressionAttributeValues={
            ":p": ep_progress,
            ":i": change,
        }
    )


def change_watched_eps_v2(username, api_name, api_id, change, special=False):
    collection_name, item_id = get_collection_and_item_id(api_name, api_id)
    change_watched_eps(
        username,
        collection_name,
        item_id,
        change,
        special=special
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
    if index_name in ["ep_progress", "special_progress"]:
        query_kwargs["KeyConditionExpression"] += " AND #index_name < :progress"
        query_kwargs["ExpressionAttributeNames"] = {
            "#index_name": index_name,
        }
        query_kwargs["ExpressionAttributeValues"][":progress"] = {
            "N": "100"
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

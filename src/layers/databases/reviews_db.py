import os
import time
from datetime import datetime

import boto3
import dateutil.parser
from boto3.dynamodb.conditions import Key, Attr
from dynamodb_json import json_util

import logger

REVIEWS_DATABASE_NAME = os.getenv("REVIEWS_DATABASE_NAME")
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
        table = boto3.resource("dynamodb").Table(REVIEWS_DATABASE_NAME)
    return table


def _get_client():
    global client
    if client is None:
        client = boto3.client("dynamodb")
    return client


def add_item(username, api_name, api_id, data=None):
    _add_review(
        username,
        f"i_{api_name}_{api_id}",
        data=data,
    )


def add_episode(username, api_name, api_id, episode_id, data=None):
    _add_review(
        username,
        f"e_{api_name}_{api_id}_{episode_id}",
        data=data,
    )


def _add_review(username, api_info, data=None):
    if data is None:
        data = {}

    if data.get("dates_watched"):
        data["latest_watch_date"] = "0"
    try:
        _get_review(
            username,
            api_info,
            include_deleted=True,
        )
    except NotFoundError:
        data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    _update_review(
        username,
        api_info,
        data,
        clean_whitelist=["deleted_at"],
    )


def delete_item(username, api_name, api_id):
    _delete_review(
        username,
        f"i_{api_name}_{api_id}",
    )


def delete_episode(username, api_name, api_id, episode_id):
    _delete_review(
        username,
        f"e_{api_name}_{api_id}_{episode_id}",
    )


def _delete_review(username, api_info):
    data = {"deleted_at": int(time.time())}
    _update_review(username, api_info, data, clean_whitelist=[])


def get_item(username, api_name, api_id, include_deleted=False):
    return _get_review(
        username,
        f"i_{api_name}_{api_id}",
        include_deleted=include_deleted,
    )


def get_episode(username, api_name, api_id, episode_id, include_deleted=False):
    return _get_review(
        username,
        f"e_{api_name}_{api_id}_{episode_id}",
        include_deleted=include_deleted,
    )


def _get_review(username, api_info, include_deleted=False):
    kwargs = {
        "KeyConditionExpression": Key("username").eq(username) &
                                  Key("api_info").eq(api_info),
    }

    if not include_deleted:
        kwargs["FilterExpression"] = Attr("deleted_at").not_exists()

    res = _get_table().query(**kwargs)

    if not res["Items"]:
        raise NotFoundError(f"Item with api_info: {api_info} not found. ")

    return res["Items"][0]


def get_items(api_name, api_id):
    api_info = f"i_{api_name}_{api_id}"
    res = _get_table().query(
        IndexName="api_info",
        KeyConditionExpression=Key("api_info").eq(api_info),
    )

    if not res["Items"]:
        raise NotFoundError(f"Item with api_info: {api_info} not found.")

    return res["Items"]


def get_episodes(username, api_name, item_api_id):
    api_info = f"e_{api_name}_{item_api_id}_"

    paginator = _get_client().get_paginator('query')

    query_kwargs = {
        "TableName": REVIEWS_DATABASE_NAME,
        "KeyConditionExpression": "username = :username AND begins_with(api_info, :api_info)",
        "ExpressionAttributeValues": {
            ":username": {"S": username},
            ":api_info": {"S": api_info},
        },
        "ScanIndexForward": False,
        "FilterExpression": "attribute_not_exists(deleted_at)",
    }

    log.debug(f"Query kwargs: {query_kwargs}")

    page_iterator = paginator.paginate(**query_kwargs)

    res = []
    for p in page_iterator:
        for i in p["Items"]:
            i = json_util.loads(i)
            res.append(i)
    return res


def update_item(username, api_name, api_id, data,
                clean_whitelist=OPTIONAL_FIELDS):
    _update_review(
        username,
        f"i_{api_name}_{api_id}",
        data,
        clean_whitelist=clean_whitelist,
    )


def update_episode(username, api_name, api_id, episode_id, data,
                   clean_whitelist=OPTIONAL_FIELDS):
    _update_review(
        username,
        f"e_{api_name}_{api_id}_{episode_id}",
        data,
        clean_whitelist=clean_whitelist,
    )


def _update_review(username, api_info, data, clean_whitelist=OPTIONAL_FIELDS):
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
            "api_info": api_info,
        },
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values
    )


def change_watched_eps(username, api_name, api_id, change,
                       special=False):
    field_name = "ep"
    if special:
        field_name = "special"

    api_info = f"i_{api_name}_{api_id}"

    item = _get_review(username, api_info)
    if f"{field_name}_count" not in item or item[f"{field_name}_count"] == 0:
        ep_progress = 0
    else:
        ep_progress = (item[f"watched_{field_name}s"] + (change)) / item[
            f"{field_name}_count"]
    ep_progress = round(ep_progress * 100, 2)

    _get_table().update_item(
        Key={
            "username": username,
            "api_info": api_info,
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


def get_user_items(username, index_name=None, status_filter=None):
    paginator = _get_client().get_paginator('query')

    query_kwargs = {
        "TableName": REVIEWS_DATABASE_NAME,
        "KeyConditionExpression": "username = :username AND "
                                  "begins_with(api_info, :api_info) ",
        "ExpressionAttributeValues": {
            ":username": {"S": username},
            ":api_info": {"S": "i_"}
        },
        "ScanIndexForward": False,
        "FilterExpression": "attribute_not_exists(deleted_at)"
    }

    if index_name is not None:
        query_kwargs["IndexName"] = index_name
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


def put_item(item):
    _get_table().put_item(
        Item=item,
    )

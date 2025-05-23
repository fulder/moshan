import json
import os
import time
from datetime import datetime
from decimal import Decimal
from urllib.parse import quote, unquote

import boto3
import dateutil.parser
from boto3.dynamodb.conditions import Attr, Key
from decimal_encoder import DecimalEncoder
from dynamodb_json import json_util
from loguru import logger

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

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if data.get("dates_watched"):
        data["latest_watch_date"] = "0"
    try:
        current_item = _get_review(
            username,
            api_info,
            include_deleted=True,
        )
        created_at = current_item.get("created_at", now)
    except NotFoundError:
        data["created_at"] = now
        created_at = data["created_at"]

    if data.get("status") == "backlog":
        data["backlog_date"] = created_at

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
        "KeyConditionExpression": Key("username").eq(username)
        & Key("api_info").eq(api_info),
    }

    if not include_deleted:
        kwargs["FilterExpression"] = Attr("deleted_at").not_exists()

    res = _get_table().query(**kwargs)

    if not res["Items"]:
        raise NotFoundError(f"Item with api_info: {api_info} not found. ")

    return res["Items"][0]


def get_all_items(username, sort=None, cursor=None, filter=None):
    kwargs = {
        "KeyConditionExpression": Key("username").eq(username),
        "FilterExpression": Attr("deleted_at").not_exists(),
    }
    if sort is not None:
        kwargs["IndexName"] = sort
        kwargs["Limit"] = 100
        kwargs["ScanIndexForward"] = False
    else:
        kwargs["KeyConditionExpression"] &= Key("api_info").begins_with("i_")

    if sort == "ep_progress":
        kwargs["KeyConditionExpression"] &= Key("ep_progress").between(
            Decimal("0.01"), Decimal("99.99")
        )
    elif sort == "latest_watch_date":
        kwargs["FilterExpression"] &= Key("api_info").begins_with("i_")

    if filter == "in_progress":
        kwargs["FilterExpression"] &= Attr("status").is_in(
            ["following", "watching"]
        )
        del kwargs["Limit"]
    elif filter == "only_backlog":
        kwargs["FilterExpression"] &= Attr("status").eq("backlog")
        del kwargs["Limit"]

    if cursor is not None:
        kwargs["ExclusiveStartKey"] = json.loads(unquote(cursor))

    res = _get_table().query(**kwargs)
    ret = {"items": []}
    for i in res.get("Items", []):
        s = i["api_info"].split("_")
        i["api_name"] = s[1]
        i["api_id"] = s[2]
        ret["items"].append(i)

    last_ev = res.get("LastEvaluatedKey")

    if last_ev is not None:
        logger.bind(lastEvaluatedKey=last_ev).debug("Not last page")
        ret["end_cursor"] = quote(json.dumps(last_ev, cls=DecimalEncoder))

    if not ret["items"] and last_ev is not None:
        return get_all_items(username, sort, ret["end_cursor"], filter)

    return ret


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

    paginator = _get_client().get_paginator("query")

    query_kwargs = {
        "TableName": REVIEWS_DATABASE_NAME,
        "KeyConditionExpression": (
            "username = :username AND begins_with(api_info, :api_info)"
        ),
        "ExpressionAttributeValues": {
            ":username": {"S": username},
            ":api_info": {"S": api_info},
        },
        "ScanIndexForward": False,
        "FilterExpression": "attribute_not_exists(deleted_at)",
    }

    logger.bind(params=query_kwargs).debug("Getting episodes")

    page_iterator = paginator.paginate(**query_kwargs)

    res = []
    for p in page_iterator:
        for i in p["Items"]:
            i = json_util.loads(i)
            i["api_name"] = api_name
            i["api_id"] = item_api_id
            i["episode_api_id"] = i["api_info"].split("_")[3]

            res.append(i)
    return res


def update_item(username, api_name, api_id, data, clean_whitelist=None):
    if clean_whitelist is None:
        clean_whitelist = OPTIONAL_FIELDS

    _update_review(
        username,
        f"i_{api_name}_{api_id}",
        data,
        clean_whitelist=clean_whitelist,
    )


def update_episode(
    username, api_name, api_id, episode_id, data, clean_whitelist=None
):
    if clean_whitelist is None:
        clean_whitelist = OPTIONAL_FIELDS

    _update_review(
        username,
        f"e_{api_name}_{api_id}_{episode_id}",
        data,
        clean_whitelist=clean_whitelist,
    )


def _update_review(username, api_info, data, clean_whitelist):
    data["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if data.get("dates_watched"):
        m_d = max([dateutil.parser.parse(d) for d in data["dates_watched"]])
        m_d = m_d.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        data["latest_watch_date"] = m_d.replace("000Z", "Z")

    update_expression = ""
    set_names = []
    expression_attribute_names = {}
    expression_attribute_values = {}
    for k, v in data.items():
        if v is None:
            continue

        set_names.append(f"#{k}=:{k}")
        expression_attribute_names[f"#{k}"] = k
        expression_attribute_values[f":{k}"] = v

    log = logger.bind(data=data, cleanWhitelist=clean_whitelist)
    log.debug("Starting update review")

    remove_names = []
    for o in OPTIONAL_FIELDS:
        if data.get(o) is None and o in clean_whitelist:
            remove_names.append(f"#{o}")
            expression_attribute_names[f"#{o}"] = o

    expression_attribute_names["#backlog_date"] = "backlog_date"
    if data.get("status") != "backlog":
        remove_names.append("#backlog_date")
    else:
        set_names.append("#backlog_date=#created_at")
        expression_attribute_names["#created_at"] = "created_at"

    if len(set_names) == 0 and len(remove_names) == 0:
        log.debug("No update needed, returning")
        return

    if len(set_names) > 0:
        update_expression += f"SET {','.join(set_names)}"
    if len(remove_names) > 0:
        update_expression += f" REMOVE {','.join(remove_names)}"

    key = {
        "username": username,
        "api_info": api_info,
    }

    log.bind(
        key=key,
        updateEpression=update_expression,
        expressionAttributeNames=expression_attribute_names,
        expressionAttributeValues=expression_attribute_values,
    ).debug("Running update_item")

    _get_table().update_item(
        Key=key,
        UpdateExpression=update_expression,
        ExpressionAttributeNames=expression_attribute_names,
        ExpressionAttributeValues=expression_attribute_values,
    )


def change_watched_eps(username, api_name, api_id, change, special=False):
    field_name = "ep"
    if special:
        field_name = "special"

    api_info = f"i_{api_name}_{api_id}"

    item = _get_review(username, api_info)
    count_v = item["api_cache"].get(f"{field_name}_count", 0)
    if count_v == 0:
        ep_progress = 0
    else:
        watched_v = item[f"watched_{field_name}s"]
        ep_progress = (watched_v + (change)) / count_v
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
        },
    )


def get_user_items(username, index_name=None, status_filter=None):
    paginator = _get_client().get_paginator("query")

    query_kwargs = {
        "TableName": REVIEWS_DATABASE_NAME,
        "KeyConditionExpression": (
            "username = :username AND begins_with(api_info, :api_info) "
        ),
        "ExpressionAttributeValues": {
            ":username": {"S": username},
            ":api_info": {"S": "i_"},
        },
        "ScanIndexForward": False,
        "FilterExpression": "attribute_not_exists(deleted_at)",
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
        key_exp = " AND #index_name < :progress"
        query_kwargs["KeyConditionExpression"] += key_exp
        query_kwargs["ExpressionAttributeNames"] = {
            "#index_name": index_name,
        }
        query_kwargs["ExpressionAttributeValues"][":progress"] = {"N": "100"}

    logger.bind(params=query_kwargs).debug("Getting user items")

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

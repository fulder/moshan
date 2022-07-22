import json
import os

import boto3
from loguru import logger

TOPIC_ARN = os.getenv("UPDATES_TOPIC_ARN")

topic = None


def _get_topic():
    global topic

    if topic is None:
        sns = boto3.resource("sns")
        topic = sns.Topic(TOPIC_ARN)

    return topic


def publish_show_update(api_name, api_id):
    logger.bind(apiName=api_name).bind(apiId=api_id).debug("Publish update")
    _get_topic().publish(
        Message=json.dumps(
            {
                "api_name": api_name,
                "api_id": api_id,
            }
        )
    )

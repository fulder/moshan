import json
import os

import boto3
import logger

TOPIC_ARN = os.getenv("UPDATES_TOPIC_ARN")
log = logger.get_logger(__name__)

topic = None


def _get_topic():
    global topic

    if topic is None:
        sns = boto3.resource("sns")
        topic = sns.Topic(TOPIC_ARN)

    return topic


def publish_show_update(api_name, api_id):
    log.debug(f"Publish update for: {api_name}_{api_id}")
    _get_topic().publish(
        Message=json.dumps(
            {
                "api_name": api_name,
                "api_id": api_id,
            }
        )
    )

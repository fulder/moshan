import json

from loguru import logger


def serialize(record):
    subset = {
        "timestamp": record["time"].strftime("%Y-%m-%dT%H:%M:%S%z"),
        "message": record["message"],
        "level": record["level"].name,
        "stacktrace": {
            "function": record["function"],
            "line": record["line"],
            "file": record["file"].name,
        },
    }

    for ex in record.get("extra", {}):
        subset[ex] = record["extra"][ex]

    if record.get("exception"):
        subset["exception"] = record["exception"]

    return json.dumps(subset)


def sink(message):
    serialized = serialize(message.record)
    print(serialized)


def setup_logger():
    logger.remove()
    logger.add(sink)

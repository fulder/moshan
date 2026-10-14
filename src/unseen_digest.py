import html
import os

import reviews_db
import telegram
from log import setup_logger

setup_logger()

NOTIFY_USERNAME = os.getenv("TELEGRAM_USERNAME")

# Backlog is unstarted by definition, dropped is given up on
STATUSES = ("watching", "following", "finished")

# Telegram caps a message at 4096 characters
MAX_MESSAGE_LEN = 4000


def handler(event, context):
    if not NOTIFY_USERNAME:
        return

    lines = [
        _line(i) for i in _unseen(reviews_db.get_user_items(NOTIFY_USERNAME))
    ]
    if not lines:
        return

    for message in _split(["📺 You still haven't seen:"] + lines):
        telegram.send(message, html=True)


def _unseen(items):
    items = [i for i in items if i.get("status") in STATUSES and _left(i) > 0]
    return sorted(items, key=lambda i: i["api_cache"]["title"].lower())


def _left(item):
    ep_count = item.get("api_cache", {}).get("ep_count") or 0
    return ep_count - item.get("watched_eps", 0)


def _line(item):
    _, api_name, api_id = item["api_info"].split("_", 2)
    left = _left(item)
    title = html.escape(item["api_cache"]["title"])
    url = html.escape(telegram.review_url(api_name, api_id))
    return (
        f'• <a href="{url}">{title}</a>: '
        f"{left} episode{'s' if left != 1 else ''} left"
    )


def _split(lines):
    messages = [lines[0]]
    for line in lines[1:]:
        if len(messages[-1]) + 1 + len(line) > MAX_MESSAGE_LEN:
            messages.append(line)
        else:
            messages[-1] += "\n" + line
    return messages

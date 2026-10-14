import os

import requests
from loguru import logger

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")
REVIEW_URL = "https://moshan.fulder.dev/review.html"


def review_url(api_name, api_id, episode_id=None):
    url = f"{REVIEW_URL}?api_name={api_name}&api_id={api_id}"
    if episode_id is not None:
        url += f"&episode_api_id={episode_id}"
    return url


def send(text, html=False):
    if not BOT_TOKEN or not CHAT_ID:
        return

    body = {"chat_id": CHAT_ID, "text": text}
    if html:
        body["parse_mode"] = "HTML"
    try:
        res = requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json=body,
            timeout=10,
        )
        res.raise_for_status()
    except requests.RequestException as e:
        logger.bind(error=str(e)).error("Telegram send failed")

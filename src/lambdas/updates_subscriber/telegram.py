import os

import requests
from loguru import logger

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")


def send(text):
    if not BOT_TOKEN or not CHAT_ID:
        return

    try:
        res = requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
            json={"chat_id": CHAT_ID, "text": text},
            timeout=10,
        )
        res.raise_for_status()
    except requests.RequestException as e:
        logger.bind(error=str(e)).error("Telegram send failed")

import os
import requests

import api_errors

SHOWS_API_URL = os.getenv("SHOWS_API_URL")


def get_show(show_id, token):
    res = requests.get(f"{SHOWS_API_URL}/shows/{show_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_show", res.status_code)

    return res.json()

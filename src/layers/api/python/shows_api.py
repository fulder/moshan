import os
import requests

import api_errors

SHOWS_API_URL = os.getenv("SHOWS_API_URL")


def post_show(api_name, api_id, token):
    res = requests.post(f"{SHOWS_API_URL}/show?{api_name}_id={api_id}", headers={"Authorization": token})
    if res.status_code != 202:
        raise api_errors.HttpError("Invalid response in post_show", res.status_code)

    return res.json()["show_id"]

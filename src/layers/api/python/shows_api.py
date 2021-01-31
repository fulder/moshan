import os
import requests

import api_errors

SHOWS_API_URL = os.getenv("SHOWS_API_URL")


def post_show(body, token):
    res = requests.get(f"{SHOWS_API_URL}/shows", headers={"Authorization": token}, json=body)
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response during show post", res.status_code)

    return res.json()

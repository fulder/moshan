import os
import requests

import api_errors

ANIME_API_URL = os.getenv("ANIME_API_URL")


def post_anime(body, token):
    res = requests.post(f"{ANIME_API_URL}/anime", headers={"Authorization": token}, json=body)
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in anime post", res.status_code)

    return res.json()

import os
import requests

import api_errors

ANIME_API_URL = os.getenv("ANIME_API_URL")


def get_anime(anime_id, token):
    res = requests.get(f"{ANIME_API_URL}/anime/{anime_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_anime", res.status_code)

    return res.json()

import os
import requests

import api_errors

ANIME_API_URL = os.getenv("ANIME_API_URL")


def post_anime(api_name, api_id, token):
    res = requests.post(f"{ANIME_API_URL}/anime?{api_name}_id={api_id}", headers={"Authorization": token})
    if res.status_code != 202:
        raise api_errors.HttpError(f"Invalid response: {res.status_code}")

    return res.json()["anime_id"]


def get_animes(ids, token):
    ids = ",".join(ids)
    res = requests.get(f"{ANIME_API_URL}/animes/{ids}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError(f"Invalid response: {res.status_code}")

    return res.json()

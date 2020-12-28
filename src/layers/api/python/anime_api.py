import os
import requests

import api_errors

ANIME_API_URL = os.getenv("ANIME_API_URL")


def get_anime(anime_id, token):
    res = requests.get(f"{ANIME_API_URL}/anime/{anime_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_anime", res.status_code)

    return res.json()


def get_animes(ids, token):
    ids = ",".join(ids)
    res = requests.get(f"{ANIME_API_URL}/animes/{ids}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_animes", res.status_code)

    return res.json()

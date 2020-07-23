import os

import requests

ANIME_API_URL = os.getenv("ANIME_API_URL")


class Error(Exception):
    pass


class HttpError(Error):
    pass


def post_anime(mal_id, token):
    res = requests.post(f"{ANIME_API_URL}/anime?mal_id={mal_id}", headers={"Authorization": token})
    if res.status_code != 204:
        raise HttpError(f"Invalid response: {res.status_code}")

    return res.json()["anime_id"]

import os
import requests

import api_errors

ANIME_API_URL = os.getenv("ANIME_API_URL")


def get_anime(anime_id, token):
    res = requests.get(f"{ANIME_API_URL}/anime/{anime_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_anime", res.status_code)

    return res.json()


def get_anime_by_api_id(api_name, api_id, token):
    res = requests.get(f"{ANIME_API_URL}/anime?api_name={api_name}&api_id={api_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_anime_by_api_id", res.status_code)

    return res.json()


def post_anime(body, token):
    res = requests.post(f"{ANIME_API_URL}/anime", headers={"Authorization": token}, json=body)
    if res.status_code != 202:
        raise api_errors.HttpError("Invalid response in anime post", res.status_code)

    return res.json()


def get_episode(anime_id, episode_id, token):
    res = requests.get(f"{ANIME_API_URL}/anime/{anime_id}/episodes/{episode_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_episode_by_api_id", res.status_code)

    return res.json()


def get_episode_by_api_id(anime_id, api_name, api_id, token):
    res = requests.get(f"{ANIME_API_URL}/anime/{anime_id}/episodes?api_name={api_name}&api_id={api_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_episode_by_api_id", res.status_code)

    return res.json()


def post_episode(item_id, body, token):
    res = requests.post(f"{ANIME_API_URL}/anime/{item_id}/episodes", headers={"Authorization": token}, json=body)
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in anime episode post", res.status_code)

    return res.json()

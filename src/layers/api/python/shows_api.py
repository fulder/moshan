import os
import requests

import api_errors
from utils import get_v4_signature_auth

SHOWS_API_URL = os.getenv("SHOWS_API_URL")


def get_show(show_id):
    res = requests.get(f"{SHOWS_API_URL}/shows/{show_id}", auth=get_v4_signature_auth())
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_show", res.status_code)

    return res.json()


def get_show_by_api_id(api_name, api_id):
    res = requests.get(f"{SHOWS_API_URL}/shows?api_name={api_name}&api_id={api_id}", auth=get_v4_signature_auth())
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_shows_by_api_id", res.status_code)

    return res.json()


def post_show(body):
    res = requests.post(f"{SHOWS_API_URL}/shows", json=body, auth=get_v4_signature_auth())
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response during show post", res.status_code)

    return res.json()


def get_episode(item_id, episode_id):
    res = requests.get(f"{SHOWS_API_URL}/shows/{item_id}/episodes/{episode_id}", auth=get_v4_signature_auth())
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response during show post", res.status_code)

    return res.json()


def get_episode_by_api_id(api_name, api_id):
    res = requests.get(f"{SHOWS_API_URL}/episodes?api_name={api_name}&api_id={api_id}", auth=get_v4_signature_auth())
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_shows_by_api_id", res.status_code)

    return res.json()


def post_episode(item_id, body):
    res = requests.post(f"{SHOWS_API_URL}/shows/{item_id}/episodes", json=body, auth=get_v4_signature_auth())
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response during show post", res.status_code)

    return res.json()

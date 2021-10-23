import os
import requests

import utils

SHOWS_API_URL = os.getenv("SHOWS_API_URL")


def get_show(show_id, api_name=None):
    url = f"{SHOWS_API_URL}/shows/{show_id}"
    if api_name is not None:
        url += f"?api_name={api_name}"

    res = requests.get(
        url, auth=utils.get_v4_signature_auth()
    )
    if res.status_code != 200:
        raise utils.HttpError("Invalid response in get_show", res.status_code)

    return res.json()


def get_show_by_api_id(api_name, api_id):
    res = requests.get(
        f"{SHOWS_API_URL}/shows?api_name={api_name}&api_id={api_id}",
        auth=utils.get_v4_signature_auth(),
    )
    if res.status_code != 200:
        raise utils.HttpError(
            "Invalid response in get_shows_by_api_id", res.status_code
        )

    return res.json()


def post_show(body):
    res = requests.post(
        f"{SHOWS_API_URL}/shows", json=body, auth=utils.get_v4_signature_auth()
    )
    if res.status_code != 200:
        raise utils.HttpError(
            "Invalid response during show post", res.status_code
        )

    return res.json()


def get_episode(item_id, episode_id):
    res = requests.get(
        f"{SHOWS_API_URL}/shows/{item_id}/episodes/{episode_id}",
        auth=utils.get_v4_signature_auth(),
    )
    if res.status_code != 200:
        raise utils.HttpError(
            "Invalid response during show post", res.status_code
        )

    return res.json()


def get_episode_by_api_id(api_name, api_id):
    res = requests.get(
        f"{SHOWS_API_URL}/episodes?api_name={api_name}&api_id={api_id}",
        auth=utils.get_v4_signature_auth(),
    )
    if res.status_code != 200:
        raise utils.HttpError(
            "Invalid response in get_shows_by_api_id", res.status_code
        )

    return res.json()


def post_episode(item_id, body):
    res = requests.post(
        f"{SHOWS_API_URL}/shows/{item_id}/episodes",
        json=body,
        auth=utils.get_v4_signature_auth(),
    )
    if res.status_code != 200:
        raise utils.HttpError(
            "Invalid response during show post", res.status_code
        )

    return res.json()

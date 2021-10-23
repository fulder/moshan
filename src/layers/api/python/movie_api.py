import os
import requests

import utils

MOVIE_API_URL = os.getenv("MOVIE_API_URL")


def get_movie(movie_id, token):
    res = requests.get(f"{MOVIE_API_URL}/movies/{movie_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise utils.HttpError("Invalid response in get_show", res.status_code)

    return res.json()


def get_movie_by_api_id(api_name, api_id, token):
    res = requests.get(f"{MOVIE_API_URL}/movies?api_name={api_name}&api_id={api_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise utils.HttpError("Invalid response in get_shows_by_api_id", res.status_code)

    return res.json()


def post_movie(body, token):
    res = requests.post(f"{MOVIE_API_URL}/movies", headers={"Authorization": token}, json=body)
    if res.status_code != 200:
        raise utils.HttpError("Invalid response during movie post", res.status_code)

    return res.json()

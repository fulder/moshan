import os
import requests

import api_errors

MOVIE_API_URL = os.getenv("MOVIE_API_URL")


def get_movie(movie_id, token):
    res = requests.get(f"{MOVIE_API_URL}/movies/{movie_id}", headers={"Authorization": token})
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response in get_show", res.status_code)

    return res.json()


def post_movie(body, token):
    res = requests.post(f"{MOVIE_API_URL}/movies", headers={"Authorization": token}, json=body)
    if res.status_code != 200:
        raise api_errors.HttpError("Invalid response during movie post", res.status_code)

    return res.json()

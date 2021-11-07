import os

import requests

import logger
import utils

log = logger.get_logger(__name__)

TMDB_TOKEN = os.getenv("TMDB_TOKEN")


class TmdbApi:
    def __init__(self):
        self.base_url = "https://api.themoviedb.org/3"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TMDB_TOKEN}"
        }

        log.debug("Tmdb base_url: {}".format(self.base_url))

    def get_item(self, movie_id):
        res = requests.get(
            f"{self.base_url}/movie/{movie_id}",
            headers=self.headers,
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

import os

import requests

import logger

log = logger.get_logger(__name__)

TMDB_TOKEN = os.getenv("TMDB_TOKEN")


class Error(Exception):
    pass


class HTTPError(Error):

    def __init__(self, code):
        Error.__init__(self, f"Unexpected status code: {code}")
        self.code = code


class TmdbApi:
    def __init__(self):
        self.base_url = "https://api.themoviedb.org/3"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer ${TMDB_TOKEN}"
        }

        log.debug("Tmdb base_url: {}".format(self.base_url))

    def get_movie(self, movie_id):
        res = requests.get(
            f"{self.base_url}/movie/{movie_id}",
            headers=self.headers,
        )

        if res.status_code != 200:
            raise HTTPError(res.status_code)
        return res.json()

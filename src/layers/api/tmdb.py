import os

from loguru import logger
import utils

TMDB_TOKEN = os.getenv("TMDB_TOKEN")


class TmdbApi:
    def __init__(self):
        self.base_url = "https://api.themoviedb.org/3"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TMDB_TOKEN}",
        }

        logger.bind(baseUrl=self.base_url, headers=self.headers).debug("Initialized TmdbApi")

    def get_item(self, movie_id):
        return self._get(f"/movie/{movie_id}")

    def get_changes(self, page=1):
        return self._get(f"/movie/changes?page={page}")

    def get_all_changes(self):
        ret = self.get_changes()
        total_pages = ret["total_pages"]
        items = ret["results"]

        for i in range(2, total_pages + 1):
            ret = self.get_changes(i)
            items += ret["results"]
        return items

    def _get(self, path):
        return utils.send_request(self.base_url, "GET", path, headers=self.headers)

import requests

import utils


class JikanApi:

    def __init__(self):
        self.base_url = "https://api.jikan.moe/v3/"

    def get_anime(self, anime_id):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episode(self, anime_id, episode_id):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}/episodes/{episode_id}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

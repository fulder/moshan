import requests

import utils


class JikanApi:

    def __init__(self):
        self.base_url = "https://api.jikan.moe/v3/"

    def get_item(self, anime_id):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episodes(self, anime_id, page=1):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}/episodes/{page}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episode_count(self, anime_id):
        page = 1
        ret = self.get_episodes(anime_id, page)
        last_page = ret["episodes_last_page"]
        ep_count = 0

        while page != last_page:
            page += 1
            ret = self.get_episodes(anime_id, page)
            ep_count += len(ret["episodes"])

        return {
            "ep_count": ep_count,
        }



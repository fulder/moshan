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

    def get_episode(self, anime_id, episode_id):
        for eps in self._episodes_generator(anime_id):
            for ep in eps:
                if ep["episode_id"] == episode_id:
                    return ep

    def get_episodes(self, anime_id, page=1):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}/episodes/{page}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episode_count(self, anime_id):
        ep_count = 0

        for eps in self._episodes_generator(anime_id):
            ep_count += len(eps)

        return {
            "ep_count": ep_count,
        }

    def _episodes_generator(self, anime_id):
        ret = self.get_episodes(anime_id)
        last_page = ret["episodes_last_page"]

        for i in range(1, last_page+1):
            ret = self.get_episodes(anime_id, i)
            yield ret["episodes"]


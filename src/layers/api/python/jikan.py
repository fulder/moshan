import requests

import utils


class JikanApi:

    def __init__(self):
        self.base_url = "https://api.jikan.moe/v3"

    def get_item(self, anime_id):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_schedule(self, day_of_week):
        res = requests.get(
            f"{self.base_url}/schedule/{day_of_week}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episode(self, anime_id, episode_id):
        page = int(int(episode_id) / 100) + 1
        eps = self.get_episodes(anime_id, page)["episodes"]

        # Hack for allowing to add 1 more episodes than currently present in api
        # to quickfix slow api updates and jikan 24h cache
        if episode_id == eps[-1]["episode_id"] + 1:
            return True

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

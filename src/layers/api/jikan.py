from datetime import datetime

import dateutil.parser
import requests

import utils


class JikanApi:

    def __init__(self):
        self.base_url = "https://api.jikan.moe/v4"

    def get_item(self, anime_id):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_schedule(self, day_of_week):
        res = requests.get(
            f"{self.base_url}/schedule?filer={day_of_week}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episode(self, anime_id, episode_id):
        page = int(int(episode_id) / 100) + 1
        eps = self.get_episodes(anime_id, page)["data"]

        if not eps:
            # Try getting previous page
            eps = self.get_episodes(anime_id, page - 1)["data"]

        if eps:
            last_id = eps[-1]["mal_id"]
        else:
            last_id = 0

        # Hack for allowing to add 12 more episodes than currently present in
        # api to quickfix slow api updates and jikan 24h cache
        if last_id < int(episode_id) <= last_id + 12:
            return True

        for ep in eps:
            if ep["mal_id"] == episode_id:
                return ep

    def get_episodes(self, anime_id, page=1):
        res = requests.get(
            f"{self.base_url}/anime/{anime_id}/episodes?page={page}",
        )

        if res.status_code != 200:
            raise utils.HttpError(res.status_code)
        return res.json()

    def get_episode_count(self, anime_id):
        ep_count = 0

        for eps in self._episodes_generator(anime_id):
            for e in eps:
                ep_date = e["aired"]
                if ep_date is None:
                    ep_date = "N/A"

                ep_date = ep_date.replace("+00:00", "")
                if ep_date != "N/A" and dateutil.parser.parse(ep_date) > datetime.now():
                    # Ignore not yet aired eps
                    continue

                ep_count += 1

        return {
            "ep_count": ep_count,
        }

    def _episodes_generator(self, anime_id):
        ret = self.get_episodes(anime_id)
        last_page = ret["pagination"]["last_visible_page"]

        for i in range(1, last_page + 1):
            ret = self.get_episodes(anime_id, i)
            yield ret["data"]

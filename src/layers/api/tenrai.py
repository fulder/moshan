import time
from datetime import datetime

import dateutil.parser
import utils
from loguru import logger


class TenraiApi:
    def __init__(self):
        self.base_url = "https://api.tenrai.org/v1"

    def get_item(self, anime_id):
        return self._get(f"/anime/{anime_id}")

    def get_schedules(self):
        return self._get_all_pages("/schedules")

    def get_season_anime(self):
        # Airing this season and announced for the coming ones
        return self._get_all_pages("/seasons/now") + self._get_all_pages(
            "/seasons/upcoming"
        )

    def get_relations(self, anime_id):
        return (self._get(f"/anime/{anime_id}/relations") or {}).get("data", [])

    @staticmethod
    def prequel_ids(relations):
        return [
            str(e["mal_id"])
            for r in relations
            if r["relation"] == "Prequel"
            for e in r["entry"]
            if e.get("type") == "anime"
        ]

    def _get_all_pages(self, path):
        ret = self._get(path)
        data = ret["data"]
        last_page = ret["pagination"]["last_visible_page"]

        for i in range(2, last_page + 1):
            ret = self._get(f"{path}?page={i}")
            data += ret["data"]

        return data

    def get_episode(self, anime_id, episode_id):
        page = int(int(episode_id) / 100) + 1
        eps = (self.get_episodes(anime_id, page) or {}).get("data", [])

        if not eps and page > 1:
            # Try getting previous page
            eps = (self.get_episodes(anime_id, page - 1) or {}).get("data", [])

        if eps:
            last_id = eps[-1]["mal_id"]
        else:
            last_id = 0

        # Hack for allowing to add 25 more episodes than currently present in
        # api to quickfix slow api updates and tenrai 24h cache
        if last_id < int(episode_id) <= last_id + 25:
            return True

        for ep in eps:
            if ep["mal_id"] == episode_id:
                return ep

    def get_episodes(self, anime_id, page=1):
        return self._get(f"/anime/{anime_id}/episodes?page={page}")

    def get_episode_count(self, anime_id):
        ep_count = 0
        for eps in self._episodes_generator(anime_id):
            for e in eps:
                ep_date = e["aired"]
                if ep_date is None:
                    ep_date = "N/A"

                ep_date = ep_date.replace("+00:00", "")
                if (
                    ep_date != "N/A"
                    and dateutil.parser.parse(ep_date) > datetime.now()
                ):
                    # Ignore not yet aired eps
                    continue

                ep_count += 1

        return {
            "ep_count": ep_count,
        }

    def get_item_ep_count(self, anime_id, api_item):
        # While airing, count only released episodes; the planned total
        # (api_item["episodes"]) would keep progress below 100%.
        ep_count = self.get_episode_count(anime_id)["ep_count"]
        if api_item.get("status") == "Finished Airing":
            # MAL's official total wins; Tenrai's list can hold episodes of a
            # sequel entry (Shingeki no Kyojin S3 lists 22, MAL says 12)
            ep_count = api_item.get("episodes") or ep_count
        return ep_count

    @staticmethod
    def watched_counts(ep_count, saved_ids):
        # Only episodes 1..ep_count count (released ones while airing)
        valid = {str(n) for n in range(1, ep_count + 1)}
        return {
            "watched_eps": len({str(i) for i in saved_ids} & valid),
            "watched_specials": 0,
            "ep_count": ep_count,
            "special_count": 0,
        }

    def _get(self, path):
        try:
            return utils.send_request(self.base_url, "GET", path)
        except utils.HttpError as e:
            if e.code == 429:
                logger.info("Rate limited, sleep and try again")
                time.sleep(3)
                return self._get(path)

    def _episodes_generator(self, anime_id):
        ret = self.get_episodes(anime_id)
        last_page = ret["pagination"]["last_visible_page"]

        for i in range(1, last_page + 1):
            ret = self.get_episodes(anime_id, i)
            yield ret["data"]

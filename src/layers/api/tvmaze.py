from datetime import datetime

import dateutil.parser
import utils
from loguru import logger


class TvMazeApi:
    def __init__(self):
        self.base_url = "https://api.tvmaze.com"
        logger.bind(baseUrl=self.base_url).debug("Initialized TvMazeApi")

    def get_item(self, show_id):
        return self._get(f"/shows/{show_id}?embed=nextepisode")

    @staticmethod
    def next_episode(show):
        ep = show.get("_embedded", {}).get("nextepisode")
        if not ep or not ep.get("airstamp"):
            return None
        return {
            "season": ep.get("season"),
            "number": ep.get("number"),
            "airstamp": ep["airstamp"],
        }

    def get_episode(self, episode_id):
        return self._get(f"/episodes/{episode_id}")

    def get_day_updates(self):
        return self._get("/updates/shows?since=day")

    def get_show_episodes(self, show_id):
        return self._get(f"/shows/{show_id}/episodes?specials=1")

    def get_show_episodes_count(self, show_id):
        return self.count_episodes(self.get_show_episodes(show_id))

    @staticmethod
    def aired_episode_ids(episodes):
        regular = set()
        specials = set()
        for e in episodes:
            if (
                not e.get("airdate")
                or dateutil.parser.parse(e["airdate"]) > datetime.now()
            ):
                # Ignore not yet aired eps
                continue

            if e["type"] == "regular":
                regular.add(str(e["id"]))
            else:
                specials.add(str(e["id"]))
        return regular, specials

    @classmethod
    def count_episodes(cls, episodes):
        regular, specials = cls.aired_episode_ids(episodes)
        return {
            "ep_count": len(regular),
            "special_count": len(specials),
        }

    @classmethod
    def watched_counts(cls, episodes, saved_ids):
        # Only saved episodes that have aired count, so episodes saved early
        # or removed from TVMaze can't push progress past 100%
        regular, specials = cls.aired_episode_ids(episodes)
        saved = {str(i) for i in saved_ids}
        return {
            "watched_eps": len(saved & regular),
            "watched_specials": len(saved & specials),
            "ep_count": len(regular),
            "special_count": len(specials),
        }

    def _get(self, path):
        return utils.send_request(self.base_url, "GET", path)

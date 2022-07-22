from datetime import datetime

import dateutil.parser
from loguru import logger
import utils


class TvMazeApi:
    def __init__(self):
        self.base_url = "https://api.tvmaze.com"
        logger.bind(baseUrl=self.base_url).debug("Initialized TvMazeApi")

    def get_item(self, show_id):
        return self._get(f"/shows/{show_id}")

    def get_episode(self, episode_id):
        return self._get(f"/episodes/{episode_id}")

    def get_day_updates(self):
        return self._get("/updates/shows?since=day")

    def get_show_episodes(self, show_id):
        return self._get(f"/shows/{show_id}/episodes?specials=1")

    def get_show_episodes_count(self, show_id):
        episodes = self.get_show_episodes(show_id)

        ep_count = 0
        special_count = 0

        for e in episodes:
            if (
                e["airdate"] == ""
                or dateutil.parser.parse(e["airdate"]) > datetime.now()
            ):
                # Ignore not yet aired eps
                continue

            if e["type"] == "regular":
                ep_count += 1
            else:
                special_count += 1

        return {
            "ep_count": ep_count,
            "special_count": special_count,
        }

    def _get(self, path):
        return utils.send_request(self.base_url, "GET", path)

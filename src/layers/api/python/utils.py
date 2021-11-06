import os

import boto3
from requests_aws4auth import AWS4Auth
from threading import Lock, Thread

import tmdb
import tvmaze

items_lock = Lock()
merged_items = []

tvmaze_api = tvmaze.TvMazeApi()
tmdb_api = tmdb.TmdbApi()


class Error(Exception):
    pass


class HttpError(Error):

    def __init__(self, message, status_code):
        super(HttpError, self).__init__(message)
        self.status_code = status_code


def get_v4_signature_auth():
    session = boto3.Session()
    credentials = session.get_credentials()
    region = os.getenv("AWS_REGION")
    return AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        "execute-api",
        session_token=credentials.token
    )


class MediaRequestThread(Thread):

    def __init__(self, item, token, remove_status, show_api=None):
        Thread.__init__(self)
        self.item = item
        self.collection_name = item["collection_name"]
        self.item_id = item["item_id"]
        self.token = token
        self.remove_status = remove_status
        self.show_api = show_api

    def run(self):
        import anime_api

        s_ret = None
        if self.collection_name == "movie":
            tmdb_id = self.item["api_info"].split("_")[1]
            s_ret = {
                "tmdb":tmdb_api.get_movie(tmdb_id)
            }
        if self.collection_name == "show":
            tvmaze_id = self.item["api_info"].split("_")[1]
            s_ret = {
                "tvmaze": tvmaze_api.get_show(tvmaze_id)
            }
        elif self.collection_name == "anime":
            s_ret = anime_api.get_anime(self.item_id, self.token)

        del self.item["username"]
        del self.item["item_id"]
        if self.remove_status:
            del self.item["status"]

        self.item = {**s_ret, **self.item}

        items_lock.acquire()
        merged_items.append(self.item)
        items_lock.release()


def merge_media_api_info_from_items(items, remove_status, token, show_api=None):
    global merged_items
    merged_items = []

    threads = []
    for i in items:
        t = MediaRequestThread(i, token, remove_status, show_api=show_api)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    return merged_items

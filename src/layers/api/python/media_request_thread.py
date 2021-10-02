from threading import Lock, Thread

import anime_api
import movie_api
import shows_api

items_lock = Lock()
merged_items = []


class MediaRequestThread(Thread):

    def __init__(self, item, token, remove_status):
        Thread.__init__(self)
        self.item = item
        self.collection_name = item["collection_name"]
        self.item_id = item["item_id"]
        self.token = token
        self.remove_status = remove_status

    def run(self):
        s_ret = None
        if self.collection_name == "movie":
            s_ret = movie_api.get_movie(self.item_id, self.token)
        if self.collection_name == "show":
            s_ret = shows_api.get_show(self.item_id)
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


def merge_media_api_info_from_items(items, remove_status, token):
    global merged_items
    merged_items = []

    threads = []
    for i in items:
        t = MediaRequestThread(i, token, remove_status)
        t.start()
        threads.append(t)

    for t in threads:
        t.join()

    return merged_items

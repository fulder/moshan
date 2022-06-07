from threading import Lock, Thread

items_lock = Lock()
merged_items = []


class Error(Exception):
    pass


class HttpError(Error):
    def __init__(self, code):
        Error.__init__(self, f"Unexpected status code: {code}")
        self.code = code


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
        import jikan
        import tmdb
        import tvmaze

        api_map = {
            "tvmaze": tvmaze.TvMazeApi(),
            "tmdb": tmdb.TmdbApi(),
            "mal": jikan.JikanApi(),
        }

        s = self.item["api_info"].split("_")
        api_name = s[0]
        api_id = s[1]

        api_ret = {api_name: api_map[api_name].get_item(api_id)}

        del self.item["username"]
        del self.item["item_id"]
        if self.remove_status:
            del self.item["status"]

        self.item = {**api_ret, **self.item}

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

import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS


def test_get_watch_hisotry():
    res = requests.get(f"{API_URL}/watch-history", headers=BASE_HEADERS)

    assert res.status_code == 200
    item = res.json()[0]
    assert item["id"] == 20
    assert item["title"] == "Naruto"
    time.sleep(1)

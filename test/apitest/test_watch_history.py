import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS


def test_get_watch_history_invalid_auth():
    res = requests.get(f"{API_URL}/watch-history", headers={"Authorization": "Invalid"})

    assert res.status_code == 401


def test_post_item():

    res = requests.post(f"{API_URL}/watch-history/", headers=BASE_HEADERS)

    assert res.status_code == 200

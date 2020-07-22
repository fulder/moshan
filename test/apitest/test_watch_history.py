import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS


def test_get_watch_history_invalid_auth():
    res = requests.get(f"{API_URL}/watch-history", headers={"Authorization": "Invalid"})

    assert res.status_code == 401


def test_post_item():
    res = requests.get(f"{API_URL}/watch-history/collection/invalid/123", headers=BASE_HEADERS)

    assert res.status_code == 400
    assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}

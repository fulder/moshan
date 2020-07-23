import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS, ANIME_API_URL


# def test_get_watch_history_invalid_auth():
#     res = requests.get(f"{API_URL}/watch-history", headers={"Authorization": "Invalid"})
#
#     assert res.status_code == 401
#     time.sleep(1)
#
#
# def test_get_invalid_collection_item():
#     res = requests.get(f"{API_URL}/watch-history/collection/invalid/123", headers=BASE_HEADERS)
#
#     assert res.status_code == 400
#     assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}
#     time.sleep(1)


def test_post_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)

    print(res.text)
    assert res.status_code == 400
    assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}
    time.sleep(1)

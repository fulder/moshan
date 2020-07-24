import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS


def test_get_watch_history_invalid_auth():
    res = requests.get(f"{API_URL}/watch-history", headers={"Authorization": "Invalid"})

    assert res.status_code == 401
    time.sleep(1)


def test_get_invalid_collection_item():
    res = requests.get(f"{API_URL}/watch-history/collection/invalid/123", headers=BASE_HEADERS)

    assert res.status_code == 400
    assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}
    time.sleep(1)


def test_post_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)

    assert res.status_code == 204
    time.sleep(1)


def test_delete_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.delete(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", headers=BASE_HEADERS)
    assert res.status_code == 404
    time.sleep(1)


def test_get_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", headers=BASE_HEADERS)
    assert res.status_code == 200
    assert res.json() == {}
    time.sleep(1)

import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS


def test_get_watch_history_invalid_auth():
    res = requests.get(f"{API_URL}/watch-history", headers={"Authorization": "Invalid"})

    assert res.status_code == 401
    time.sleep(1)


def test_get_watch_history_invalid_collection_item():
    res = requests.get(f"{API_URL}/watch-history/collection/invalid/123", headers=BASE_HEADERS)

    assert res.status_code == 400
    assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}
    time.sleep(1)


def test_get_watch_history():
    # Setup
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"id": "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"api_id": "0877ed59-6198-5cf4-a254-91564808db3e"}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    # Test
    res = requests.get(f"{API_URL}/watch-history", headers=BASE_HEADERS)
    time.sleep(1)
    res_col = requests.get(f"{API_URL}/watch-history/collection/anime", headers=BASE_HEADERS)

    # Assert
    assert res.status_code == 200
    assert res_col.status_code == 200

    item_res = res.json()
    item_res_col = res_col.json()

    assert len(item_res["items"]) >= 2
    assert "23d5d8c1-2ab0-5279-a501-4d248dc9a63c" in item_res["items"]
    assert item_res["items"]["23d5d8c1-2ab0-5279-a501-4d248dc9a63c"]["collection_name"] == "anime"
    assert "created_at" in item_res["items"]["23d5d8c1-2ab0-5279-a501-4d248dc9a63c"]
    assert "updated_at" in item_res["items"]["23d5d8c1-2ab0-5279-a501-4d248dc9a63c"]

    assert len(item_res_col["items"]) >= 2
    assert "cad1a63b-d876-5833-a5db-8cd33f4c92ec" in item_res["items"]
    assert item_res["items"]["cad1a63b-d876-5833-a5db-8cd33f4c92ec"]["collection_name"] == "anime"
    assert "created_at" in item_res["items"]["cad1a63b-d876-5833-a5db-8cd33f4c92ec"]
    assert "updated_at" in item_res["items"]["cad1a63b-d876-5833-a5db-8cd33f4c92ec"]
    time.sleep(1)


def test_post_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"id": "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"}, headers=BASE_HEADERS)

    assert res.status_code == 204
    time.sleep(1)


def test_delete_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"id": "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.delete(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c",
                          headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c",
                       headers=BASE_HEADERS)
    assert res.status_code == 404
    time.sleep(1)


def test_get_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"id": "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c",
                       headers=BASE_HEADERS)
    assert res.status_code == 200

    item = res.json()
    assert item["collection_name"] == "anime"
    assert item["item_id"] == "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"
    assert "created_at" in item
    assert "updated_at" in item
    time.sleep(1)


def test_patch_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"id": "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.patch(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c", json={"rating": 2, "overview": "My overview", "review": "My review"}, headers=BASE_HEADERS)
    print(res.text)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c", headers=BASE_HEADERS)
    assert res.status_code == 200

    item = res.json()
    assert item["rating"] == 2
    assert item["overview"] == "My overview"
    assert item["review"] == "My review"

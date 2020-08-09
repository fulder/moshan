import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS


# def test_get_episodes_invalid_auth():
#     res = requests.get(f"{API_URL}/watch-history/collection/anime/123/episode", headers={"Authorization": "Invalid"})
#
#     assert res.status_code == 401
#     time.sleep(1)
#
#
# def test_get_episodes_invalid_collection_item():
#     res = requests.get(f"{API_URL}/watch-history/collection/invalid/123/episode", headers=BASE_HEADERS)
#
#     assert res.status_code == 400
#     assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}
#     time.sleep(1)
#
#
# def test_get_episodes():
#     # Setup
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#     res = requests.post(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode", json={"episode_id": "10"}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     # Test
#     res = requests.get(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode", headers=BASE_HEADERS)
#     time.sleep(1)
#
#     # Assert
#     assert res.status_code == 200
#
#     item_res = res.json()
#
#     assert len(item_res["episodes"]) == 1
#     assert item_res["total_pages"] == 1
#     assert "10" in item_res["episodes"]
#     assert item_res["episodes"]["10"]["collection_name"] == "anime"
#     assert item_res["episodes"]["10"]["item_id"] == "23d5d8c1-2ab0-5279-a501-4d248dc9a63c"
#     assert "created_at" in item_res["episodes"]["10"]
#     assert "updated_at" in item_res["episodes"]["10"]
#     time.sleep(1)
#
#
# def test_post_episode():
#     res = requests.post(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode",
#                         json={"episode_id": "10"}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)


# def test_delete_episode():
#     res = requests.post(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode",
#                         json={"episode_id": "10"}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.delete(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode/10",
#                           headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.get(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode/10",
#                        headers=BASE_HEADERS)
#     assert res.status_code == 404
#     time.sleep(1)


def test_get_episode():
    res = requests.post(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode",
                        json={"episode_id": "10"}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/23d5d8c1-2ab0-5279-a501-4d248dc9a63c/episode/10",
                       headers=BASE_HEADERS)
    assert res.status_code == 200

    item = res.json()
    assert item["collection_name"] == "anime"
    assert item["item_id"] == "6fea451e-90db-5366-bbde-9a65b83f8f64"
    assert "created_at" in item
    assert "updated_at" in item
    time.sleep(1)

#
# def test_patch_anime_item():
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.patch(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", json={"rating": 2, "overview": "My overview", "review": "My review"}, headers=BASE_HEADERS)
#     print(res.text)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.get(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", headers=BASE_HEADERS)
#     assert res.status_code == 200
#
#     item = res.json()
#     assert item["rating"] == 2
#     assert item["overview"] == "My overview"
#     assert item["review"] == "My review"

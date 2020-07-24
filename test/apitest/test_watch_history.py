import time

import requests

from apitest.conftest import API_URL, BASE_HEADERS

#
# def test_get_watch_history_invalid_auth():
#     res = requests.get(f"{API_URL}/watch-history", headers={"Authorization": "Invalid"})
#
#     assert res.status_code == 401
#     time.sleep(1)
#
#
# def test_get_watch_history_invalid_collection_item():
#     res = requests.get(f"{API_URL}/watch-history/collection/invalid/123", headers=BASE_HEADERS)
#
#     assert res.status_code == 400
#     assert res.json() == {'message': "Invalid collection name, allowed values: ['anime', 'show', 'movie']"}
#     time.sleep(1)
#
#
# def test_get_watch_history():
#     # Setup
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 21}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     # Test
#     res = requests.get(f"{API_URL}/watch-history", headers=BASE_HEADERS)
#     res_col = requests.get(f"{API_URL}/watch-history/collection/anime", headers=BASE_HEADERS)
#
#     # Assert
#     assert res.status_code == 200
#     assert res_col.status_code == 200
#
#     item_res = res.json()
#     item_res_col = res_col.json()
#
#     assert len(item_res["items"]) == 2
#     assert item_res["total_pages"] == 1
#     assert item_res["items"][0]["collection_name"] == "anime"
#     assert item_res["items"][0]["item_id"] == "6fea451e-90db-5366-bbde-9a65b83f8f64"
#     assert "created_at" in item_res["items"][0]
#     assert "updated_at" in item_res["items"][0]
#
#     assert len(item_res_col["items"]) == 2
#     assert item_res_col["total_pages"] == 1
#     assert item_res_col["items"][1]["collection_name"] == "anime"
#     assert item_res_col["items"][1]["item_id"] == "0df2c324-4b3b-5e4b-8574-770c7c601dc4"
#     assert "created_at" in item_res_col["items"][1]
#     assert "updated_at" in item_res_col["items"][1]
#     time.sleep(1)
#
#
# def test_post_anime_item():
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
#
#     assert res.status_code == 204
#     time.sleep(1)
#
#
# def test_delete_anime_item():
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.delete(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64",
#                           headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.get(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64",
#                        headers=BASE_HEADERS)
#     assert res.status_code == 404
#     time.sleep(1)
#
#
# def test_get_anime_item():
#     res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
#     assert res.status_code == 204
#     time.sleep(1)
#
#     res = requests.get(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64",
#                        headers=BASE_HEADERS)
#     assert res.status_code == 200
#
#     item = res.json()
#     assert item["collection_name"] == "anime"
#     assert item["item_id"] == "6fea451e-90db-5366-bbde-9a65b83f8f64"
#     assert "created_at" in item
#     assert "updated_at" in item
#     time.sleep(1)


def test_patch_anime_item():
    res = requests.post(f"{API_URL}/watch-history/collection/anime", json={"item_add_id": 20}, headers=BASE_HEADERS)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.patch(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", json={"rating": 2}, headers=BASE_HEADERS)
    print(res.text)
    assert res.status_code == 204
    time.sleep(1)

    res = requests.get(f"{API_URL}/watch-history/collection/anime/6fea451e-90db-5366-bbde-9a65b83f8f64", headers=BASE_HEADERS)
    assert res.status_code == 200
    assert res.json()["rating"] == 2

import pytest
from tenrai import TenraiApi


@pytest.fixture()
def mocked_send_request(mocker):
    return mocker.patch("utils.send_request")


@pytest.fixture()
def mocked_api(mocked_send_request):
    return TenraiApi()


def _create_schedules_res(data, pages=2):
    return {
        "pagination": {
            "last_visible_page": pages,
        },
        "data": data,
    }


def test_get_schedules(mocked_send_request, mocked_api):
    exp_res = [
        {"mal_id": 1},
        {"mal_id": 2},
        {"mal_id": 5},
        {"mal_id": 3},
        {"mal_id": 4},
    ]

    mocked_send_request.side_effect = [
        _create_schedules_res(exp_res[0:3]),
        _create_schedules_res(exp_res[3:5]),
    ]

    a = mocked_api.get_schedules()
    assert a == exp_res


@pytest.mark.parametrize(
    "status,planned,exp",
    [
        ("Currently Airing", 10, 8),
        ("Finished Airing", 10, 10),
        ("Finished Airing", 6, 6),
        ("Finished Airing", None, 8),
    ],
)
def test_get_item_ep_count(mocker, mocked_api, status, planned, exp):
    mocker.patch.object(
        mocked_api, "get_episode_count", return_value={"ep_count": 8}
    )
    api_item = {"status": status, "episodes": planned}
    assert mocked_api.get_item_ep_count(1, api_item) == exp


def test_watched_counts_only_released():
    # 13 saved ahead of release, -1 is a stray
    saved = ["1", "2", "12", "13", "-1"]

    assert TenraiApi.watched_counts(12, saved) == {
        "watched_eps": 3,
        "watched_specials": 0,
        "ep_count": 12,
        "special_count": 0,
    }


def test_get_episode_empty_episode_list(mocked_send_request, mocked_api):
    # Tenrai lists no episodes yet: allowed by the 25-episode margin
    mocked_send_request.return_value = {
        "pagination": {"last_visible_page": 1},
        "data": [],
    }

    assert mocked_api.get_episode(33010, "1") is True
    assert mocked_send_request.call_count == 1

import pytest
from jikan import JikanApi


@pytest.fixture()
def mocked_send_request(mocker):
    return mocker.patch("utils.send_request")


@pytest.fixture()
def mocked_api(mocked_send_request):
    return JikanApi()


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

from app import Review

EPISODE_DATA = {
    "api_id": "21",
    "episode_api_id": "999",
    "api_name": "mal",
    "api_info": "e_mal_21_999",
    "created_at": "2021-11-14 22:17:33",
    "dates_watched": ["2021-11-14T22:46:37.453Z"],
    "latest_watch_date": "2021-11-14T22:46:37.453Z",
    "updated_at": "2021-11-15 07:32:25",
    "username": "m_fulder",
}


def test_parse_episode():
    review = Review(**EPISODE_DATA)
    assert review.model_dump(exclude_none=True) == {
        "api_id": "21",
        "api_name": "mal",
        "created_at": "2021-11-14 22:17:33",
        "dates_watched": ["2021-11-14T22:46:37.453Z"],
        "latest_watch_date": "2021-11-14T22:46:37.453Z",
        "updated_at": "2021-11-15 07:32:25",
    }

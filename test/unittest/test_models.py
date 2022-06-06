from api.app import Review

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
    assert review.dict() == {'api_cache': None,
 'api_id': '21',
 'api_name': 'mal',
 'backlog_date': None,
 'created_at': '2021-11-14 22:17:33',
 'dates_watched': ['2021-11-14T22:46:37.453Z'],
 'deleted_at': None,
 'ep_count': None,
 'ep_progress': None,
 'latest_watch_date': '2021-11-14T22:46:37.453Z',
 'special_count': None,
 'special_progress': None,
 'status': None,
 'updated_at': '2021-11-15 07:32:25',
 'watched_eps': None,
 'watched_specials': None}

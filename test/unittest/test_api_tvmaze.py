from tvmaze import TvMazeApi


def test_next_episode():
    show = {
        "_embedded": {
            "nextepisode": {
                "season": 4,
                "number": 1,
                "airstamp": "2026-11-15T08:00:00+00:00",
                "name": "Chapitre 1",
            }
        }
    }
    assert TvMazeApi.next_episode(show) == {
        "season": 4,
        "number": 1,
        "airstamp": "2026-11-15T08:00:00+00:00",
    }


def test_no_next_episode():
    assert TvMazeApi.next_episode({}) is None


def test_watched_counts_only_aired_known():
    episodes = [
        {"id": 1, "type": "regular", "airdate": "2020-01-01"},
        {"id": 2, "type": "regular", "airdate": "2020-01-08"},
        {"id": 3, "type": "significant_special", "airdate": "2020-01-09"},
        {"id": 4, "type": "regular", "airdate": "2099-01-01"},
    ]
    # 4 saved before airing, 999 removed from TVMaze: neither counts
    saved = ["1", "3", "4", "999"]

    assert TvMazeApi.watched_counts(episodes, saved) == {
        "watched_eps": 1,
        "watched_specials": 1,
        "ep_count": 2,
        "special_count": 1,
    }

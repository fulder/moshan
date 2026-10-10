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

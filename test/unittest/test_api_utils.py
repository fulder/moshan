from unittest.mock import MagicMock

import pytest
import utils
from requests import HTTPError


def _failing(mocker, status, body):
    response = MagicMock(status_code=status, text=body)
    response.json.side_effect = (
        ValueError if body.startswith("<") else lambda: {"status": status}
    )
    response.raise_for_status.side_effect = HTTPError(response=response)
    mocker.patch("requests.request", return_value=response)
    return mocker.patch.object(utils, "logger")


@pytest.mark.parametrize("status,level", [(404, "warning"), (500, "error")])
def test_error_log_level(mocker, status, level):
    logger = _failing(mocker, status, "{}")

    with pytest.raises(utils.HttpError):
        utils.send_request("https://x", "GET", "/a")

    getattr(logger.bind.return_value, level).assert_called_once()


def test_non_json_error_still_raises_http_error(mocker):
    _failing(mocker, 502, "<html>Bad Gateway</html>")

    with pytest.raises(utils.HttpError) as e:
        utils.send_request("https://x", "GET", "/a")
    assert e.value.code == 502

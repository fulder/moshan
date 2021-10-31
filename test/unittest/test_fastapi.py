import jwt
from boto3.dynamodb.conditions import Key, Attr

from starlette.testclient import TestClient
from api.watch_histories import app

client = TestClient(app)

TEST_USER = "TEST_USER"
TEST_SHOW_ID = "123123"


def test_get_item(mocked_watch_history_db):
    mocked_watch_history_db.table.query.return_value = {
        "Items": [
            {
                "api_info": f"tvmaze_{TEST_SHOW_ID}"
            }
        ]
    }
    token = jwt.encode(
        {"username": TEST_USER},
        "secret",
        algorithm="HS256"
    ).decode("utf-8")

    response = client.get(
        f"/watch-histories/items/tvmaze/{TEST_SHOW_ID}",
        headers={"Authorization": token}
    )

    exp_kwargs = {
        "IndexName": "api_info",
        "KeyConditionExpression": Key("username").eq(TEST_USER) &
                                  Key("api_info").eq(f"tvmaze_{TEST_SHOW_ID}"),
        "FilterExpression": Attr("deleted_at").not_exists(),
    }
    mocked_watch_history_db.table.query.assert_called_with(**exp_kwargs)
    assert response.status_code == 200
    assert response.json() == {"api_info": f"tvmaze_{TEST_SHOW_ID}"}

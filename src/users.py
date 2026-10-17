import os

import boto3

client = None


def usernames():
    global client
    if client is None:
        client = boto3.client("cognito-idp")

    pages = client.get_paginator("list_users").paginate(
        UserPoolId=os.getenv("USER_POOL_ID")
    )
    return sorted(
        u["Username"] for page in pages for u in page["Users"] if u["Enabled"]
    )

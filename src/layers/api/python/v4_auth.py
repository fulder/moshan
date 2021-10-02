import os

import boto3
from requests_aws4auth import AWS4Auth


def get_v4_signature_auth():
    session = boto3.Session()
    credentials = session.get_credentials()
    region = os.getenv("AWS_REGION")
    return AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        "execute-api",
        session_token=credentials.token
    )

import jwt


def get_client_id(jwt_str):
    # Verification done by apigw
    decoded = jwt.decode(jwt_str, verify=False)
    return decoded["client_id"]

import jwt


def get_username(jwt_str):
    # Verification done by apigw
    decoded = jwt.decode(jwt_str, verify=False)
    return decoded["username"]

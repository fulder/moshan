import os

API_URL = "https://api.watch-history.moshan.tv/v1"
BASE_HEADERS = {
    "Authorization": os.getenv("TOKEN")
}

import os

API_URL = "https://api.watch-history.moshan.tv"
BASE_HEADERS = {
    "Authorization": os.getenv("TOKEN")
}

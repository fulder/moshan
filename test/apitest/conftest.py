import os

API_URL = os.getenv("API_URL")
ANIME_API_URL = os.getenv("ANIME_API_URL")
BASE_HEADERS = {
    "Authorization": os.getenv("TOKEN")
}

# Moshan

Watch history for movies, shows and anime in one place: [moshan.fulder.dev](https://moshan.fulder.dev)

VIDEO_URL

- **One search, three sources:** TMDB for movies, TVMaze for shows, MyAnimeList (via Tenrai) for anime.
- **Watching:** progress per show, counted from aired episodes only; an Upcoming tab for sequels that haven't aired yet.
- **Calendar:** your shows' episodes, season premieres, announced sequels and backlog movies, in local time.
- **Telegram pings:** new episodes, season premieres and announced sequels, checked daily.
- **Tips:** recommendations from the titles you rated 7 or higher.
- **Stats:** watches per month for each collection.

Backend: Python Lambda (Powertools) behind API Gateway, DynamoDB, deployed with AWS SAM.
Frontend: vanilla JS + Pico CSS in `docs/`, served by GitHub Pages.

## Testing

### Unittest

* `make test`

### Apitest

* `export TOKEN=<TEST_USER_TOKEN>`
* `make apitest`

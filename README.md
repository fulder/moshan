[![Build Status](https://travis-ci.com/projectmovio/watch-history-service.svg?branch=master)](https://travis-ci.com/projectmovio/watch-history-service)
[![Coverage Status](https://coveralls.io/repos/github/projectmovio/watch-history-service/badge.svg?branch=master)](https://coveralls.io/github/projectmovio/watch-history-service?branch=master)

# Testing

## Unittest

* `make test`

## Apitest

* `export API_URL=<WATCH_HISTORY_API_URL>`
* `export TOKEN=<TEST_USER_TOKEN>`
* `make apitest`

# Deploy

* `export ANIME_API_URL=<ANIME_API_URL>`
* `cdk deploy`
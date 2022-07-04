# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v10.0.0] - 2022-06-06

### Changed
* Added more strict response models for following `GET` routes including change of JSON keys from snake case to camel case:
  * `GET /items/{api_name}/{item_api_id}`
  * `GET /items`
  * `GET /items/{api_name}/{item_api_id}/episodes`
  * `GET /items/{api_name}/{item_api_id}/episodes/{episode_api_id}`

## [v9.0.0] - 2022-04-30

### Changed
* Remove `/watch-histories` prefix from all routes

## [v8.0.9] - 2022-03-05

### Changed
* Fix null image in mal api cache

## [v8.0.8] - 2022-03-05

### Added
* Support for `latest_watch_date` in `GET /watch-histories/items` route

## [v8.0.7] - 2022-03-05

### Changed
* Fix invalid jikan schedules route

## [v8.0.6] - 2022-02-26

### Changed
* Fixes for jikan episodes with `null` aired date
* Change deployment workflow condition to more specific src folders


## [v8.0.5] - 2022-02-26

### Changed
* Fixes for jikan v4 returned data

## [v8.0.4] - 2022-02-26

### Changed
* Upgrade jikan API from v3 to v4

## [v8.0.3] - 2022-02-26

### Changed
* Fix bug with empty anime ep aired date

## [v8.0.2] - 2022-02-26

### Changed
* Remove dry-run workflow
* Attempt fix failing deployment job

## [v8.0.1] - 2022-02-26

### Changed
* Update AWS OIDC provider thumbprint to `6938fd4d98bab03faadb97b34396831e3780aea1`
* Run deploy workflow on pushes to default branch
* Run deploy workflow only if service files or SAM related files changes
* Add CHANGELOG.md instead of using tags

## [8.0.0] - 2021-11-01

* Remove dependencies to show service and add new routes on `/watch-histories/`
  basepath.

## What's Changed

* Remove show service by @fulder in https://github.com/fulder/moshan/pull/92

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.4.5...v8.0.0

## [7.4.5] - 2021-10-27

## What's Changed

* Add missing index arns by @fulder in https://github.com/fulder/moshan/pull/91

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.4.3...v7.4.5

## [7.4.3] - 2021-10-27

## What's Changed

* Fix watch history by progress request by @fulder
  in https://github.com/fulder/moshan/pull/90

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.4.2...v7.4.3

## [7.4.2] - 2021-10-26

## What's Changed

* Use LT instead of '<' by @fulder in https://github.com/fulder/moshan/pull/89

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.4.1...v7.4.2

## [7.4.1] - 2021-10-26

## What's Changed

* Add ep_progress and special_progress to sort by @fulder
  in https://github.com/fulder/moshan/pull/88

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.4.0...v7.4.1

## [7.4.0] - 2021-10-26

## What's Changed

* Change KeyConditionExpression for progress indexes by @fulder
  in https://github.com/fulder/moshan/pull/87

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.10...v7.4.0

## [7.3.10] - 2021-10-26

## What's Changed

* Fix indexes by @fulder in https://github.com/fulder/moshan/pull/86

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.9...v7.3.10

## [7.3.9] - 2021-10-26

## What's Changed

* Remove old unused LSI by @fulder in https://github.com/fulder/moshan/pull/85

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.8...v7.3.9

## [7.3.8] - 2021-10-26

## What's Changed

* Tweaks for getting items sorted by progress by @fulder
  in https://github.com/fulder/moshan/pull/84

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.7...v7.3.8

## [7.3.7] - 2021-10-25

## What's Changed

* Fix removal of data during readd of episode by @fulder
  in https://github.com/fulder/moshan/pull/83

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.6...v7.3.7

## [7.3.6] - 2021-10-25

## What's Changed

* Check if query params are none by @fulder
  in https://github.com/fulder/moshan/pull/82

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.5...v7.3.6

## [7.3.5] - 2021-10-25

## What's Changed

* Forgotten lambda permissions for new db by @fulder
  in https://github.com/fulder/moshan/pull/81

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.4...v7.3.5

## [7.3.4] - 2021-10-25

## What's Changed

* Forgotten database_name env var by @fulder
  in https://github.com/fulder/moshan/pull/80

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.3...v7.3.4

## [7.3.3] - 2021-10-25

## What's Changed

* Fix invalid include deleted eps condition by @fulder
  in https://github.com/fulder/moshan/pull/79

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.2...v7.3.3

## [7.3.2] - 2021-10-25

## What's Changed

* Remove not existing #e param by @fulder
  in https://github.com/fulder/moshan/pull/78

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.1...v7.3.2

## [7.3.1] - 2021-10-25

## What's Changed

* Add optional api_name query param to episode_by_id API @fulder
  in https://github.com/fulder/moshan/pull/77

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.3.0...v7.3.1

## [7.3.0] - 2021-10-25

## What's Changed

* Update episode progress by @fulder in https://github.com/fulder/moshan/pull/76

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.2.4...v7.3.0

## [7.2.4] - 2021-10-23

## What's Changed

* Migration fixes by @fulder in https://github.com/fulder/moshan/pull/53

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.2.3...v7.2.4

## [7.2.3] - 2021-10-21

## What's Changed

* Get show id not item_id by @fulder in https://github.com/fulder/moshan/pull/72
* Check ep_progress in item not property by @fulder
  in https://github.com/fulder/moshan/pull/73
* Use correct property for special_progress by @fulder
  in https://github.com/fulder/moshan/pull/74
* Set progress to 0 if ep/special count is 0 by @fulder
  in https://github.com/fulder/moshan/pull/75

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.2.2...v7.2.3

## [7.2.2] - 2021-10-21

## What's Changed

* Rename live stage to prod by @fulder
  in https://github.com/fulder/moshan/pull/71

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.2.1...v7.2.2

## [7.2.1] - 2021-10-21

## What's Changed

* Rename show updates subscriber handler by @fulder
  in https://github.com/fulder/moshan/pull/69
* Get show by api id in show-updates sub by @fulder
  in https://github.com/fulder/moshan/pull/70

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.2.0...v7.2.1

## [7.2.0] - 2021-10-21

## What's Changed

* Show updates subscription by @fulder
  in https://github.com/fulder/moshan/pull/68

**Full Changelog**: https://github.com/fulder/moshan/compare/v7.1.2...v7.2.0

## [7.1.2] - 2021-10-02

* Potential fix making backlog requests fail with 500 code

## [7.1.1] - 2021-10-02

* Remove reserved `AWS_REGION` env variable from lambdas

## [7.1.0] - 2021-10-02

* Change shows API auth from cognito JWT to AWS_IAM

## [7.0.10] - 2021-09-21

* Fix bug with items not being merged during full watch-history fetch

## [7.0.9] - 2021-09-21

* Add missing env vars to `watch_history` lambda config

## [7.0.8] - 2021-09-21

* Send media request in parallel during full watch-history get

## [7.0.7] - 2021-09-21

* Send request to media services during `GET /watch-history`
  and `GET /watch-history/collection/{collection_name}`

## [7.0.6] - 2021-09-21

* Return `collection_name` in `GET /watch-history` response list.

## [7.0.5] - 2021-09-20

* Fix bug with `GET /watch-history` while using the `status` query param not
  injecting the filter with correct value

## [7.0.4] - 2021-09-20

* Fix bug with reserved DynamoDB `status` word

## [7.0.3] - 2021-09-20

* Fix invalid `state` instead of `status` query param

## [7.0.2] - 2021-09-20

* Fix missing GSI query permission for `GET /watch-history` lambda

## [7.0.1] - 2021-09-20

* Increase lambda memory and timeout
* Fix invalid `watch_dates` sort value in `GET /watch-history`

## [7.0.0] - 2021-09-20

* Remove pagination support during watch history GET

## [6.1.0] - 2021-07-18

* Add `latest_watch_date` to items with episodes equal to the latest item
  episode `latest_watch_date` value.

## [6.0.8] - 2021-07-18

* Catch invalid offset errors
  in `GET /watch-history/collection/{collection_name}`, returned 500 codes
  instead of 400 before
* Add missing lambda permissions for GSI query
  making `GET /watch-history/collection/{collection_name}` while setting
  the `sort` query parameter crash with 500 code

## [6.0.7] - 2021-07-18

* Correct sort value for `GET /watch-history/collection/{collection_name}`
  from `dates_watched` to `latest_watch_date`

## [6.0.6] - 2021-07-11

* Don't overwrite `created_at` property every time item/episode is deleted and
  re-added

## [6.0.5] - 2021-07-10

* Fix bug with no item ID being returned after `POST`ing of item
* Fix `PUT` episode bug not saving the episode data (although 204 was returned
  to the client)

## [6.0.4] - 2021-07-10

* Skip removal of item/episode properties during re-add of entity

## [6.0.3] - 2021-07-10

* Fix invalid update expression making new `PUT` routes fail with 500 status
  code

## [6.0.2] - 2021-07-10

* Fix bug with item/episode fields colliding with DynamoDB reserved words
  making `PUT` calls (not setting the reserved fields) fail.

## [6.0.1] - 2021-07-10

* Fix CORS issue blocking `PUT` requests

## [6.0.0] - 2021-07-10

* Change `PATCH /watch-history/collection/{collection_name}/{item_id}` verb
  to `PUT`
*
Change `PATCH /watch-history/collection/{collection_name}/{item_id}/episode/{episode_id}`
verb to `PUT`
* Remove skipped item properties during `PUT`

## [5.0.13] - 2021-07-10

* Allow `backlog` status for items

## [5.0.12] - 2021-07-03

* Fix bug with anime item post expecting invalid status code making the item not
  being added to user watch-history

## [5.0.11] - 2021-07-02

* Return 200 code and item/episode id during post

## [5.0.10] - 2021-07-02

* Return both watch-history and item/episode info during get by api_id

## [5.0.9] - 2021-07-01

* Return both watch-history and item/episode info during get by ID

## [5.0.8] - 2021-07-01

* Don't try to post episode using invalid body during watch-history patch (
  potential fix for 400 code during episodes patch)

## [5.0.7] - 2021-06-27

* Add missing env variables for post episode lambda
* Remove duplicate `json()` call causing 500 errors

## [5.0.6] - 2021-06-27

* Add missing service URLs to episodes lambda making it crash with internal
  error

## [5.0.5] - 2021-06-27

* Support `api_name` and `api_id` query params
  in `GET /watch-history/collection/{collection_name}/episode` route

## [5.0.4] - 2021-06-27

* Fix 500 issue during post of items and episodes

## [5.0.3] - 2021-06-27

* Return 404 on not found item by `api_id`

## [5.0.2] - 2021-06-27

* Support `api_name` and `api_id` query params
  in `GET /watch-history/collection/{collection_name}` route

## [5.0.1] - 2021-06-25

* Fix bug with missing `api` layers making episode routes fail with 500 code

## [5.0.0] - 2021-06-25

* Upgrade `urllib` from 1.26.2 to 1.26.5
* Remove `v1` prefixes from shows and anime APIs
* Change post items/episodes data to include third party ids together with
  optional review/overview/rating etc. data
* Post items/episode items to show/anime service using `api_name` and `api_id`
  keys from post data

## [4.0.3] - 2021-01-24

* Fix bug with not all items being returned for collections

## [4.0.2] - 2021-01-24

* Add missing environment variables for item by id lambda (Fix for another 500
  during patch)

## [4.0.1] - 2021-01-24

* Add missing API layer to watch history item by ID lambda (possible fix for 500
  error)

## [4.0.0] - 2021-01-24

* Remove `/v1` prefix from all routes

## [3.1.3] - 2021-01-24

* Don't patch items if ID is not existing in collection APIs

## [3.1.2] - 2021-01-17

* Add (temporary) copy script from old to new dynamo tables
* Fix bug with item/episode patches not setting `latest_watch_date` if the list
  contains only one item

## [3.1.1] - 2021-01-17

* Fix inconsistent names of `dates_watched` property in:
    * `PATCH /v1/watch-history/collection/{collection_name}/{item_id}`
    * `PATCH /v1/watch-history/collection/{collection_name}/{item_id}/episode/{episode_id}`

## [3.1.0] - 2021-01-16

* Add `POST /v1/watch-history/movie` support

## [3.0.2] - 2021-01-11

* Fix invalid show API path during item POST

## [3.0.1] - 2021-01-09

* Fix internal server bug in `POST /v1/watch-history/{collection_name}` when
  body didn't include `id`.

## [3.0.0] - 2021-01-02

* `POST /v1/watch-history/{collection}` now requires item UUID instead of
  correct third party API id. Clients should instead post the correct item to
  the correct collection API instead of this being done inside the watch history
  post making the services much dependent of each other. Watch history service
  will still (only) check if the UUID is an existing and real collection item
  before adding it to the list.
* First show item (POST and GET) implementation.
* `GET /v1/watch-history/{collection}` will no longer get data from other (
  anime) APIs, this should be done (when needed) by clients as well.
* `GET /v1/watch-history/{collection}` returns a simple list of items instead of
  a map mapping item id to item data.

## [2.0.1] - 2020-11-28

* Hardcode and prefix layer names in order to not collide with other services

## [2.0.0] - 2020-11-22

*
Change `PATCH /v1/watch-history/collection/{collection_name}/{item_id}/episode/{episode_id}`
property from date_watched to date**s**_watched

## [1.2.0] - 2020-11-14

* Prefix all API routes with `/v1`
* New episode routes:
    * `GET /v1/watch-history/collection/{collection_name}/{item_id}/episode`
    * `POST /v1/watch-history/collection/{collection_name}/{item_id}/episode`
    * `GET /v1/watch-history/collection/{collection_name}/{item_id}/episode/{episode_id}`
    * `PATCH /v1/watch-history/collection/{collection_name}/{item_id}/episode/{episode_id}`
    * `DELETE /v1/watch-history/collection/{collection_name}/{item_id}/episode/{episode_id}`
* Use github actions for unittesting and autmatic CDK diff, synth and deploy
* Add custom domain name for watch-history gateway
* Enable HTTPS using ACM cert
* Hardcode domain name for watch-history API
* Hardcode anime service API URL
* Increase burst/request limits to 10/5 requests per second
* `GET /v1/watch-history/collection/{collection_name}` changes:
    * Set limit of items per collection to 20 in
    * Fetch anime posters from anime service for all returned items
* Use cognito username as unique identifier in watch-history items (instead of
  incorrct used cognito client id)

## [1.1.0] - 2020-07-30

* Prefix all routes with version `v1
* Bump apigatewayv2 lib to `1.50.0`
* Hardcode `ANIME_API_URL` to `api.anime.moshan.tv`
* Hardcode `DOMAIN_NAME` to `api.watch-history.moshan.tv`
* Use unique cognito username as primary key in watch-history DynamoDb table
* Add CORS settings for `https://moshan.tv` domain to watch-history gateway
* Join anime data (poster, title, start_date) in response
  of `GET /v1/watch-history/collections/anime`
* Return map of `item_id`'s to data in `GET /v1/watch-history/collections/anime`
  response

## [1.0.0] - 2020-07-24

* Change watch-history service from flask app and docker container into a pure
  serverless application deployed in AWS using CDK
* Bump to 1.0.0 as this was a major release and is deployed in prod in AWS (
  although closed alpha right now)

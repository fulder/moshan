# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Moshan ("watch-history.moshan.tv") is a personal watch-history/review tracker for
TV shows, movies, and anime. It's an AWS SAM (Serverless Application Model) app:
a FastAPI backend running on Lambda behind API Gateway, backed by DynamoDB, plus
a static vanilla HTML/JS/Bootstrap frontend in `docs/` (served separately, e.g.
GitHub Pages — see `docs/CNAME`).

The backend aggregates data from three external media APIs depending on
`api_name`: `tmdb` (movies), `tvmaze` (TV shows), `mal` (anime, via Tenrai —
see `src/layers/api/tenrai.py`).

## Commands

Backend (Python, Poetry-managed):
* `make test` — installs required poetry groups and runs the unit test suite (`test/unittest`)
* Run a single unit test: `poetry run pytest test/unittest/test_routes.py::test_get_item -vv`
* `make apitest` — runs live API integration tests against the deployed API (`test/apitest`); requires `TOKEN=<TEST_USER_TOKEN>` env var (a valid Cognito JWT)
* `make format` — runs `black`, `isort`, then `flake8` (line length 80, black profile for isort)
* `make deploy-provision` — deploys `template_provision.yml` (the DynamoDB table stack) via `sam deploy`

Frontend (`docs/`, vanilla JS + Bootstrap):
* `npm install`
* `make lint` / `make lintfix` (from `docs/Makefile`, via eslint)

## Architecture

**Lambda layers vs. lambdas**: Shared code lives in `src/layers/{api,databases,utils}`
and is attached to each Lambda function as an AWS Lambda Layer (see `template.yml`).
Each layer's dependencies are their own optional Poetry dependency group
(`layers-api`, `layers-databases`, `layers-utils`, `layers-fastapi`), which is why
`make test` installs several groups at once. Because layers are just added to
`sys.path` (see `test/unittest/conftest.py`), imports across the codebase are
flat/unqualified (e.g. `import tenrai`, `import reviews_db`), not package-relative.

**Three Lambda functions** (`src/lambdas/`), all sharing the layers above:
* `api` — the FastAPI app (`src/lambdas/api/app`) handling all HTTP routes, mounted via Mangum. `app/__init__.py` wires routes and does lightweight JWT parsing (signature verification is handled upstream by the Cognito authorizer in API Gateway, not in app code). `app/routes.py` contains the actual business logic per route.
* `updates_publisher` — polls the three external APIs for changes/schedules and publishes SNS notifications (`ItemUpdatesTopic`) for shows present in the reviews DB.
* `updates_subscriber` — consumes those SNS notifications and refreshes the cached `api_cache` fields (title, status, episode counts, etc.) on the corresponding DynamoDB item.

**External API clients** (`src/layers/api/`): `tmdb.py`, `tvmaze.py`, `tenrai.py`
each wrap one third-party API behind a small class with `get_item`/`get_episode*`
methods. `utils.py` provides shared HTTP plumbing (`send_request`, `HttpError`)
and `MediaRequestThread`/`merge_media_api_info_from_items`, which fan out
requests to multiple APIs concurrently and merge results. The `mal` api_name
maps to `TenraiApi` (Tenrai is a Jikan-schema-compatible anime API; Jikan itself
had repeated 504s/instability, see git history around the `tenrai.py` migration).

**Data model**: DynamoDB single-table (`reviews`), accessed through
`src/layers/databases/reviews_db.py`. Items are keyed by `(username, api_name, api_id)`;
episodes are stored as a related sub-collection per item.

**Infra as code**: `template.yml` defines the full stack (Cognito user pool for
auth, HTTP API Gateway with a Cognito JWT authorizer, the three Lambda functions,
the SNS topic, IAM roles/policies). `template_provision.yml` defines the
DynamoDB table separately (deployed independently via `make deploy-provision`)
so the table survives app stack redeploys. `template_cognito_cert.yml` handles
the ACM certificate for the Cognito custom domain.

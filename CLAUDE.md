# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Moshan is a personal watch-history/review tracker for TV shows, movies and
anime: an AWS SAM app with a Python Lambda API (Powertools
`APIGatewayHttpResolver`) behind an API Gateway HTTP API, DynamoDB, and a
static vanilla JS + Pico CSS frontend in `docs/` on GitHub Pages
(moshan.fulder.dev; API at api.moshan.fulder.dev).

The backend aggregates data from three external media APIs depending on
`api_name`: `tmdb` (movies), `tvmaze` (TV shows), `mal` (anime, via Tenrai —
see `src/tenrai.py`).

## Commands

Backend (Python, uv-managed; groups in `pyproject.toml`: `lambda`, `pytest`,
`lint`, `dev`):
* `make test` — unit tests (`test/unittest`)
* Single test: `uv run --group pytest --group lambda pytest test/unittest/test_routes.py::test_get_item -vv`
* `make apitest` — live API tests (`test/apitest`); needs `TOKEN=<Cognito JWT>`
* `make format` — black, isort, flake8 (line length 80)
* `make deploy-provision` — deploys `template_provision.yml` (the DynamoDB table stack)
* Deploy is CI only (`deploy.yml` on push to main): `uv export --only-group
  lambda` → `src/requirements.txt`, `sam build --use-container`, `sam deploy`.
  To test a build locally without SAM installed, run `sam build` inside the
  `public.ecr.aws/sam/build-python3.13` Docker image.

Frontend (`docs/`): `npm install`, `make lint` / `make lintfix` (eslint).

## Architecture

**One code bundle, no layers**: all code lives flat in `src/` and is the
`CodeUri` of all three Lambdas (only the handler differs), so imports are
flat (`import tenrai`, `import reviews_db`); tests put `src/` on `sys.path`
(`test/unittest/conftest.py`).

**Three Lambda functions**:
* `app.handler` — the API (`src/app`): `__init__.py` wires routes, auth
  middleware (decodes the JWT for `username` only; the signature is checked by
  the Cognito authorizer in API Gateway), pydantic validation (422) and
  camelCase JSON via `models.py`; `routes.py` holds the logic. Tests call the
  handler with HTTP API v2 events via the small client in `conftest.py`.
* `updates_publisher.handler` — daily: polls the external APIs for changes and
  publishes SNS notifications (`ItemUpdatesTopic`) for listed items.
* `updates_subscriber.handler` — consumes those and refreshes `api_cache`
  (title, status, episode counts…) and sends Telegram pings.

**External API clients**: `src/tmdb.py`, `tvmaze.py`, `tenrai.py`; shared
HTTP plumbing (`send_request`, `HttpError`) in `src/utils.py`.

**Data model**: DynamoDB single table `reviews` via `src/reviews_db.py`,
keyed `(username, api_info)` with `api_info` = `i_<api>_<id>` for items and
`e_<api>_<id>_<ep>` for episodes. `/items` uses a `ProjectionExpression`
(`LIST_FIELDS`): add a field there if a list page needs it.

**Infra**: `template.yml` (Cognito, HTTP API + JWT authorizer, Lambdas, SNS,
alarms); `template_provision.yml` (table, deployed separately);
`template_cognito_cert.yml` (ACM cert).

**Cost**: the AWS bill is near zero and should stay that way; state the cost
impact of infra changes. `/items` is CPU-bound (botocore parsing ~1 MB
DynamoDB pages), which is why the API Lambda has 2048 MB (a full vCPU).

## Workflow tips

- Preview UI changes without a login: copy the page to a temp
  `docs/_x.html`, inject a script before the module that sets a fake JWT
  (`x.<base64 {"exp":4102444800,"username":"me"}>.x`) in localStorage and
  stubs `window.fetch` for api.moshan.fulder.dev, serve `docs/` on :8080
  and screenshot with `google-chrome --headless=new --screenshot`. Delete
  the temp page afterwards.
- Bulk data fixes: browser-console scripts using
  `localStorage.moshan_access_token`, dry run first. Re-adding an existing
  episode (POST) triggers a recount without touching its data.
- Third-party data (TVMaze/Tenrai/TMDB) is cached in localStorage via
  `docs/includes/js/common/cache.js` (`moshan_cache_` prefix, per-call TTL);
  the user's own data is always fetched fresh. Hard refresh doesn't clear it.
- "Page is slow": measure before changing. Ask the user to run a console
  one-liner summarizing `performance.getEntriesByType('resource')` per
  host/path (count + finish time), not to paste a HAR.
- To split API server time from download time, time `fetch` until the
  headers arrive vs `await r.json()` in the console (gzip is on, so the
  download is rarely the slow part).

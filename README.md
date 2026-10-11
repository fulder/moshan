# Moshan

Watch history for movies, shows and anime in one place. A personal project you can
self-host in your own AWS account; there is no public service to sign up for.

https://github.com/user-attachments/assets/f0e1dbe1-9e5b-4209-b499-64d904ce7804

- **One search, three sources:** TMDB for movies, TVMaze for shows, MyAnimeList (via Tenrai) for anime.
- **Watching:** progress per show, counted from aired episodes only; an Upcoming tab for sequels that haven't aired yet.
- **Calendar:** your shows' episodes, season premieres, announced sequels and backlog movies, in local time.
- **Telegram pings:** new episodes, season premieres and announced sequels, checked daily.
- **Tips:** recommendations from the titles you rated 7 or higher.
- **Stats:** watches per month for each collection.

Backend: Python Lambda (Powertools) behind API Gateway, DynamoDB, deployed with AWS SAM.
Frontend: vanilla JS + Pico CSS in `docs/`, served by GitHub Pages.

## Self-hosting

Not tested from a fresh fork, so expect to adjust. You need an AWS account, a domain and
a [TMDB](https://www.themoviedb.org/settings/api) API read token.

1. Fork the repo and replace `moshan.fulder.dev` with your domain: `docs/CNAME`,
   `deploy.yml` (`DomainName`), `docs/includes/js/api/moshan.js` (API URL),
   `docs/includes/js/common/config.js` (site URL) and `src/updates_subscriber.py` (ping links).
   Put your TMDB token in `docs/includes/js/api/tmdb.js`.
2. Pick your own SAM bucket name in `samconfig.toml` and create that S3 bucket.
3. Deploy the base stack once from your machine (DynamoDB table + GitHub deploy role):
   `sam deploy --template-file template_provision.yml --stack-name moshan-table
   --parameter-overrides DomainName=<domain> GitHubRepoPath=<you>/moshan`
4. Add GitHub secrets: `DEPLOY_ROLE_ARN` (the role from step 3), `TMDB_TOKEN`,
   `LOCAL_COGNITO_CLIENT` (Cognito app client for local dev; a placeholder works).
   Optional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_USERNAME` for pings,
   `ALARM_EMAIL` for alarms.
5. Push to `main`: the `deploy` workflow runs. While the stack is created, add the ACM
   validation record for `api.<domain>` at your DNS provider, then point `api.<domain>`
   at the API Gateway custom domain.
6. From the stack: put the Cognito app client ID and the hosted UI domain in `config.js`.
   Enable GitHub Pages on `docs/` with your domain.
7. Create your user in the Cognito console (sign-up is disabled).

## Testing

### Unittest

* `make test`

### Apitest

* `export TOKEN=<TEST_USER_TOKEN>`
* `make apitest`

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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

For older releases refer to: https://github.com/projectmovio/watch-history-service/releases
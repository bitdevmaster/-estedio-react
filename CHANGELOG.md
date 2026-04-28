# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project follows Semantic Versioning.

## [Unreleased]

### Added

- Added `ZustandProvider` and `TanstackProvider` for adapter-level config initialization.
- Added `createStore` and `createHooks` aliases for a more consistent cross-adapter API.
- Added `ReduxResourceConfig`, `assembleReduxStore`, and shared core type barrels for adapter internals.
- Added `NormalizedApiError` to the core domain plus root-level `normalizeError` and `isNormalizedApiError` exports.
- Added shared state behavior modules for cache skipping, auth token persistence, and persisted result hydration.

### Changed

- Updated TanStack Query to accept `storageByResource` and hydrate persisted query results.
- Updated adapter entry points to expose the new provider helpers, aliases, and shared error types.
- Updated README and Mintlify docs to reflect the current adapter APIs and runtime behavior.

### Fixed

- Fixed Redux resource cache check behavior for non-null falsy results.
- Fixed Redux persisted resource hydration so cached responses are restored into slice state on store creation.
- Fixed documentation drift around TanStack Query persistence, provider support, and HTTP request queue behavior.

### Refactored

- Refactored Redux store assembly into a dedicated factory helper.
- Refactored all three adapters to share auth-token and persistence behavior instead of duplicating that logic.
- Refactored the normalized error type out of the HTTP layer into the core domain.

## [0.1.1] - 2026-04-09

### Added

- Initial public package release metadata.
- Redux Toolkit + Redux Saga resource architecture.
- HTTP client, token manager, request queue, and encrypted storage adapters.
- Core resource entities, ports, and utility exports.

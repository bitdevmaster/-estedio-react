# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project follows Semantic Versioning.

## [Unreleased]

### Added

- Added resource adapters for Zustand and TanStack Query.
- Added adapter-specific package entry points:
  - @estedio/react/redux
  - @estedio/react/zustand
  - @estedio/react/tanstack-query
- Added updated README documentation for adapter-first usage.
- Added master architecture reference for @estedio/react as source-of-truth implementation.
- Added cross-framework architecture blueprint for React and Vue adapter strategy.
- Added non-breaking improvement catalog and future major version improvement classification.
- Added Estedio engineering standards guide including 200-line file governance rule.
- Added Mintlify documentation scaffold (mintlify.json + docs sections).
- Added AI skill templates for core library and UI library development workflows.
- Added release/versioning workflow documentation based on Keep a Changelog + SemVer.
- Added Vue (Nuxt) migration blueprint for behavior-preserving implementation.
- Added GitHub issue templates for bug reports and feature requests.

### Changed

- Updated dataProvider mapping keys to use:
  - access_token_key
  - refresh_token_key
- Kept access_token and refresh_token as backward-compatible aliases.
- Updated docs/examples to use adapter-specific imports.

### Fixed

- Fixed Redux resource cache check behavior for non-null falsy results.
- Added persisted resource hydration flow for Redux resource state.

## [0.1.1] - 2026-04-09

### Added

- Initial public package release metadata.
- Redux Toolkit + Redux Saga resource architecture.
- HTTP client, token manager, request queue, and encrypted storage adapters.
- Core resource entities, ports, and utility exports.

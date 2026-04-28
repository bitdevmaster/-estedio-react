# CLAUDE.md — Operational Guide for AI Coding Agents

> This document is the single source of truth for AI agents working in the
> `@estedio/react` repository. Read every section before touching a file.

---

## 1. Repository Overview

**Package:** `@estedio/react` — v0.1.1  
**Type:** TypeScript npm library (public)  
**Purpose:** Reusable hexagonal-architecture utilities for resource-based data
flows in React applications. Ships three pluggable state-management adapters
(Redux + Saga, Zustand, TanStack Query) over a shared HTTP, storage, and config
core.

**Consumer reference app:** `../bidbox-user` — a Next.js 16 App Router
application that demonstrates the canonical usage pattern for the Redux adapter.

**Build:** `tsup` — produces ESM + CJS + `.d.ts` declarations, multi-entry.  
**Node requirement:** ≥ 18.0.0  
**Repository URL:** `github.com/bitdevmaster/-estedio-react`

---

## 2. Architecture Principles

This library is built on **Hexagonal Architecture (Ports & Adapters)**. Every
architectural decision must respect the following layer hierarchy. Inner layers
MUST NOT depend on outer layers.

```
┌──────────────────────────────────────────────────────┐
│  React Integration Layer  (adapters/redux|zustand|tanstack-query)  │
├──────────────────────────────────────────────────────┤
│  State Behavior Layer     (state/behaviors/)          │
├──────────────────────────────────────────────────────┤
│  API Client Layer         (http/)                     │
├──────────────────────────────────────────────────────┤
│  Storage Layer            (storage/)                  │
├──────────────────────────────────────────────────────┤
│  Core Domain Layer        (core/)                     │
└──────────────────────────────────────────────────────┘
```

**Non-negotiable rules:**

1. `core/` imports nothing from `http/`, `storage/`, `state/`, or `adapters/`.
2. `state/behaviors/` imports only from `core/` and `http/client/token-manager`.
3. `http/` imports only from `core/` and `utils/`.
4. `storage/` imports only from `core/` and `config/`.
5. `adapters/redux|zustand|tanstack-query` may import from all lower layers.
6. No cross-adapter imports — the Redux adapter must not import from the Zustand
   adapter or vice versa.

**The three state adapters are interchangeable.** Any behavior change to how
cache-hits, token saving, or persistence works MUST be made in
`state/behaviors/` — never duplicated into adapter files.

---

## 3. Folder Structure Guide

```
@estedio-react/
├── src/
│   ├── core/
│   │   ├── entities/
│   │   │   ├── resource.entity.ts   # ResourceConfig, ResourceState, HttpMethod, SagaEffect
│   │   │   └── error.entity.ts      # NormalizedApiError (canonical location)
│   │   ├── ports/
│   │   │   ├── api.port.ts          # IApiPort — execute(resource, payload)
│   │   │   └── storage.port.ts      # IStoragePort — getAsync/setAsync/remove/clear
│   │   └── types/
│   │       ├── resource.types.ts    # Internal barrel re-export for adapters
│   │       └── hooks.types.ts       # InferPayload, InferResponse, ResourceTypeMapLike
│   │
│   ├── state/                       # Shared cross-cutting behavior layer
│   │   ├── behaviors/
│   │   │   ├── cache.behavior.ts    # shouldSkipFetch(force, currentResult)
│   │   │   ├── auth.behavior.ts     # isTokenResponse() + saveAuthTokens()
│   │   │   └── persist.behavior.ts  # readPersistedResult<T>() + persistResult()
│   │   └── types.ts                 # ResourceCallback<T>
│   │
│   ├── http/
│   │   ├── client/
│   │   │   ├── api-client.ts        # Axios client with 401 refresh flow
│   │   │   ├── api-client.types.ts  # RequestConfig; re-exports NormalizedApiError from core
│   │   │   ├── token-manager.ts     # TokenManager class + factory + singleton
│   │   │   └── request-queue.ts     # RequestQueue — enqueue/flush/reject
│   │   ├── adapters/
│   │   │   └── resource.adapter.ts  # ResourceAdapter implements IApiPort
│   │   └── index.ts                 # Public HTTP exports
│   │
│   ├── storage/
│   │   ├── encrypted-storage-base.ts  # Abstract base — AES-GCM via Web Crypto
│   │   ├── local-storage.adapter.ts   # LocalStorageAdapter + singleton
│   │   ├── session-storage.adapter.ts # SessionStorageAdapter + singleton
│   │   ├── crypto.util.ts             # encrypt() / decrypt() — PBKDF2 + AES-GCM
│   │   └── index.ts                   # Public storage exports
│   │
│   ├── adapters/
│   │   ├── redux/
│   │   │   ├── factory/
│   │   │   │   ├── create-store.ts          # assembleReduxStore() — internal
│   │   │   │   ├── create-resource-slice.ts # RTK slice factory
│   │   │   │   ├── create-resource-saga.ts  # Worker + watcher saga factory
│   │   │   │   └── resource.types.ts        # FetchPayload
│   │   │   ├── hooks/
│   │   │   │   ├── use-resource-dispatch.ts # createResourceHooks() factory
│   │   │   │   ├── use-resource-selector.ts # Standalone selector hook
│   │   │   │   └── index.ts
│   │   │   ├── composition.ts  # RootSagaDependencies interface
│   │   │   ├── create-resources.ts  # Main factory — orchestrates slices+saga+store
│   │   │   ├── provider.tsx    # <StoreProvider makeStore provider />
│   │   │   ├── types.ts        # ReduxResourceConfig alias
│   │   │   └── index.ts        # Public exports + generalized aliases
│   │   │
│   │   ├── zustand/
│   │   │   ├── factory/
│   │   │   │   └── create-resource-store.ts # Vanilla Zustand store factory
│   │   │   ├── hooks/
│   │   │   │   ├── use-resource-dispatch.ts # createResourceHooks() factory
│   │   │   │   └── index.ts
│   │   │   ├── create-resources.ts
│   │   │   ├── provider.tsx    # <ZustandProvider provider />
│   │   │   └── index.ts
│   │   │
│   │   └── tanstack-query/
│   │       ├── factory/
│   │       │   └── create-resource-query.ts # useResourceQuery + useResourceMutation factory
│   │       ├── create-resources.ts
│   │       ├── provider.tsx    # <TanstackProvider queryClient provider />
│   │       └── index.ts
│   │
│   ├── config/
│   │   └── lib-config.ts        # LibraryConfig singleton — initializeLibConfig / getLibConfig
│   │
│   ├── utils/
│   │   ├── type-guards.ts       # isRecord()
│   │   └── error.utils.ts       # normalizeError() + isNormalizedApiError()
│   │
│   └── index.ts                 # Root barrel — core + config + http + storage + utils
│
├── docs/                        # Mintlify documentation source
├── CHANGELOG.md                 # Keep a Changelog format
├── README.md                    # Public usage documentation
├── SECURITY.md                  # Vulnerability reporting policy
├── tsup.config.ts               # Build configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # ESLint (typescript-eslint + prettier)
└── .prettierrc.json             # Prettier settings
```

**File naming conventions:**
- Source files: `kebab-case.ts` / `kebab-case.tsx`
- Behavior files: `<name>.behavior.ts`
- Entity files: `<name>.entity.ts`
- Port files: `<name>.port.ts`
- Adapter factory files: `create-<name>.ts`
- Hook files: `use-<name>.ts`
- Provider files: `provider.tsx`
- Index/barrel files: `index.ts`

---

## 4. State Management Guidelines

### 4.1 Three adapters, one interface

All three adapters expose the same developer-facing surface:

```typescript
// Store/resource factory — same name in all three adapters
const result = createResources(resourceMap, options);

// Hook factory — same name in all three adapters
const { useResourceDispatch, useResourceSelector } = createResourceHooks(result);

// Generalized aliases also available
const result2 = createStore(resourceMap, options);
const hooks2  = createHooks(result);
```

The underlying implementation differs; the public interface does not.

### 4.2 ResourceConfig pattern

Every API endpoint is described by a `ResourceConfig`:

```typescript
import type { ResourceConfig } from "@estedio/react/redux";

export const authResources = {
  Login: {
    endpoint: "/auth/login",
    method: "POST",
    meta: { isAuthResource: true, persist: false, persistKey: "" },
  } satisfies ResourceConfig<LoginCredentials, AuthTokens>,
} as const;
```

Rules:
- Resource keys are **PascalCase** (e.g. `Login`, `GetProfile`, `PlaceBid`).
- Always use `satisfies ResourceConfig<TPayload, TResponse>` — never rely on
  implicit `any`.
- Use `as const` on every resource map object.
- `sagaEffect` (`"takeLatest"` | `"takeEvery"`) is Redux-only. Default is
  `"takeLatest"`. Use `"takeEvery"` only for operations where concurrent
  in-flight requests are intentional (e.g. `PlaceBid`).
- Resources with `meta.persist: true` **must** also set `meta.persistKey` to a
  non-empty string, and **must** supply a storage adapter in `storageByResource`.

### 4.3 Behavior layer — never duplicate

The following logic lives exclusively in `src/state/behaviors/`:

| Concern | Function | Location |
|---|---|---|
| Cache-hit check | `shouldSkipFetch(force, result)` | `cache.behavior.ts` |
| Auth token detection | `isTokenResponse(value)` | `auth.behavior.ts` |
| Auth token save | `saveAuthTokens(tokenMgr, response, isAuth)` | `auth.behavior.ts` |
| Hydrate from storage | `readPersistedResult<T>(meta, storage)` | `persist.behavior.ts` |
| Persist after fetch | `persistResult(meta, storage, result)` | `persist.behavior.ts` |

**Do not add inline token-saving, cache-checking, or persistence logic inside
adapter files.** Call the shared behavior functions.

### 4.4 Redux specifics

- Store construction uses `assembleReduxStore(slices, rootSaga)` from
  `factory/create-store.ts`. Do not call `configureStore` directly in
  `create-resources.ts`.
- Sagas use `yield call(behaviorFn, ...)` to invoke async behavior functions.
- The `createResources` return shape is `{ makeStore, slices }`.
- `makeStore` must be called inside `<StoreProvider>` — never at module level.

### 4.5 Zustand specifics

- Stores are vanilla Zustand instances (`createStore` from `zustand/vanilla`).
- `createResources` returns `{ stores }`.
- Each store exposes `fetch`, `clearResult`, and `reset`.

### 4.6 TanStack Query specifics

- `createResources` returns the hooks directly: `{ useResourceQuery, useResourceMutation }`.
- Query hydration from storage runs in a `useEffect` inside `useResourceQuery`.
- Only `method: "GET"` resources use `useResourceQuery`; all others use
  `useResourceMutation`.

---

## 5. API Layer Conventions

### 5.1 ResourceAdapter

`ResourceAdapter` implements `IApiPort` and maps resource names to HTTP calls.

- It performs **path interpolation**: `:param` tokens in `endpoint` are filled
  from the payload object. Extracted keys are removed from the forwarded payload.
- `MULTIPART` method requires a `FormData` payload.
- `authenticated: false` sets `skipAuth: true` on the Axios request config,
  bypassing the Bearer token interceptor.

### 5.2 APIClient

`APIClient` is an Axios wrapper. Its responsibilities are:

1. Inject Bearer token from `TokenManager` on every authenticated request.
2. Handle 401 responses: refresh the token via `refreshEndpoint`, retry the
   original request, and flush all queued concurrent requests.
3. Normalize all errors to `NormalizedApiError` (defined in
   `core/entities/error.entity.ts`).

**Do not** call `apiClient` directly from adapter or application code. Always
go through `IApiPort.execute()`.

### 5.3 TokenManager

`TokenManager` stores access and refresh tokens in an `IStoragePort`
implementation (default: `localStorageAdapter` with AES-GCM encryption).

Token key names are resolved at runtime from `LibraryConfig`. Do not hardcode
`"access_token"` or `"refresh_token"` strings anywhere outside the config
defaults.

### 5.4 Error types

`NormalizedApiError` is the canonical error shape across the entire library:

```typescript
interface NormalizedApiError {
  status: number;   // HTTP status code, 0 for non-HTTP errors
  code: string;     // Machine-readable error code
  ray_id: string;   // Optional trace ID from API response
  message: string;  // Human-readable message
}
```

`NormalizedApiError` is defined in `src/core/entities/error.entity.ts`. The
`http/client/api-client.types.ts` re-exports it from there for backward
compatibility. Always import from `core/entities/error.entity` in new code.

---

## 6. React Integration Patterns

### 6.1 Provider hierarchy

```
<TanstackProvider> / <StoreProvider> / <ZustandProvider>   ← lib config init
  └── <QueryClientProvider>  (TanStack only, handled internally)
        └── Application tree
```

All three providers accept a `provider?: Partial<LibraryConfig>` prop that
calls `initializeLibConfig` once on first render. This is the canonical config
bootstrap path.

### 6.2 Domain hooks

Consumer applications wrap `useResourceDispatch` / `useResourceSelector` into
domain-specific hooks:

```typescript
// src/adapters/hooks/use-auth.ts
export function useAuth() {
  const dispatch = useResourceDispatch();
  const loginState = useResourceSelector("Login");
  // ...named methods wrapping dispatch
  return { login, loginState, ... };
}
```

Rules:
- Domain hooks live in `src/adapters/hooks/`.
- They are always Client Components — add `"use client"` at the top.
- They receive no props; they pull everything from the store.
- They expose named, typed methods (not raw dispatch calls).
- They must not contain business logic — call use-case validators for that.

### 6.3 `"use client"` directive

Add `"use client"` to every file that:
- Uses any React hook (`useState`, `useEffect`, `useSelector`, etc.)
- Uses `useDispatch`, `useStore`, or any adapter hook
- Is a React component that renders interactive elements

Do not add it to pure utility files, entities, ports, or server-only modules.

### 6.4 Components

Feature components live in `src/adapters/components/features/<domain>/`.
Base UI primitives live in `src/adapters/components/ui/`.

- Components call domain hooks; they do not call `useResourceDispatch` directly.
- Component files end in `.tsx`; pure logic files end in `.ts`.

---

## 7. TypeScript Guidelines

### 7.1 Strict mode

`tsconfig.json` enables `"strict": true`. Never disable strict checks. Never
use `@ts-ignore` or `@ts-nocheck`.

### 7.2 `any` usage

- `@typescript-eslint/no-explicit-any` is set to `"warn"`. Treat warnings as
  errors in review.
- Use `unknown` at system boundaries; narrow with type guards.
- Never use `any` in public API types (entities, ports, hook return types).

### 7.3 Type imports

Always use `import type` for type-only imports. The ESLint rule
`@typescript-eslint/consistent-type-imports` enforces this.

```typescript
// correct
import type { ResourceConfig } from "../../core/entities/resource.entity";

// incorrect
import { ResourceConfig } from "../../core/entities/resource.entity";
```

### 7.4 Generic inference

Use `satisfies ResourceConfig<TPayload, TResponse>` on resource objects to
enforce type safety without losing the `as const` literal type. Do not use
type assertions (`as`) where `satisfies` works.

### 7.5 Return types

Always annotate public function return types explicitly. Inferred return types
are acceptable for private/internal helpers only.

### 7.6 `as const` on resource maps

Every resource map exported from an `*.resources.ts` file must end with
`as const`. This enables exhaustive key inference in `createResources`.

---

## 8. Coding Standards

### 8.1 Formatting (Prettier)

Configuration in `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

Run `yarn format` before committing. The CI gate is `yarn format:check`.

### 8.2 Linting (ESLint)

- Config: `eslint.config.mjs` — `typescript-eslint` recommended + `eslint-config-prettier`.
- Run `yarn lint` to check; `yarn lint:fix` to auto-fix.
- `@typescript-eslint/no-unused-vars` is an error. Prefix intentionally unused
  variables with `_`.

### 8.3 Comments

Default to **no comments**. Add a comment only when the **why** is non-obvious:
a hidden constraint, a workaround for a known bug, a subtle invariant, or
behavior that would surprise a future reader.

Never write:
- Comments that restate what the code does
- JSDoc blocks describing obvious parameters
- Multi-line comment headers unless it's a top-level module description
- Task or PR references inside source files

### 8.4 File size

Keep files under 200 lines where possible. A file exceeding 200 lines is a
signal to extract focused responsibilities into separate modules.

### 8.5 Naming

| Context | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `create-resource-saga.ts` |
| Classes | `PascalCase` | `TokenManager`, `APIClient` |
| Interfaces / Types | `PascalCase` | `ResourceConfig`, `NormalizedApiError` |
| Functions | `camelCase` | `createResources`, `shouldSkipFetch` |
| Constants (module-level) | `camelCase` | `tokenManager`, `localStorageAdapter` |
| Resource keys | `PascalCase` | `Login`, `GetProfile`, `PlaceBid` |
| Environment-level constants | `UPPER_SNAKE_CASE` | `ENV.API_BASE_URL` |

### 8.6 Exports

- Never use `export default`. All exports are named exports.
- Internal modules not intended for consumers are not re-exported from
  adapter `index.ts` files.
- Always add backward-compatible re-export aliases when renaming a public
  symbol rather than removing the old name.

---

## 9. Build System

**Tool:** `tsup`  
**Config:** `tsup.config.ts`

### 9.1 Entry points

```typescript
entry: {
  index:                "src/index.ts",
  "http/index":         "src/http/index.ts",
  "storage/index":      "src/storage/index.ts",
  "redux/index":        "src/adapters/redux/index.ts",
  "redux/hooks/index":  "src/adapters/redux/hooks/index.ts",
  "zustand/index":      "src/adapters/zustand/index.ts",
  "tanstack-query/index": "src/adapters/tanstack-query/index.ts",
}
```

These map to the `exports` field in `package.json`. Adding a new adapter
requires adding both an entry here and an entry in `package.json#exports`.

### 9.2 Build commands

| Command | Purpose |
|---|---|
| `yarn build` | Production build |
| `yarn dev` | Watch mode |
| `yarn type-check` | `tsc --noEmit` — must produce zero errors |
| `yarn lint` | ESLint check |
| `yarn format:check` | Prettier check |

**Before any commit:** run `yarn type-check && yarn lint && yarn format:check`.
All three must pass.

### 9.3 Peer dependencies

All state management and HTTP libraries are **optional peer dependencies**.
Do not import from them inside `core/`, `state/behaviors/`, `storage/`,
`config/`, or `utils/`. Those layers must remain framework-agnostic.

---

## 10. Refactoring Rules

1. **Never change the public API** — existing import paths, function signatures,
   return shapes, and type names must remain identical.
2. **Backward-compatible aliases first** — when adding a generalized name for an
   existing export, add the alias; keep the original name.
3. **Behavior belongs in `state/behaviors/`** — cache-hit logic, token handling,
   and persistence must never be reimplemented inside adapter files.
4. **Internal extraction is safe** — moving code between internal files (with
   no change to exported symbols) does not require a major version bump.
5. **Type-only changes are safe** — improving generic inference, adding
   overloads, or tightening types does not break consumers unless it removes
   previously accepted values.
6. **Validate with `tsc --noEmit`** — every refactor must end with zero
   TypeScript errors.
7. **One concern per file** — if a refactor ends with a file doing two distinct
   things, split it.

---

## 11. Testing Guidelines

**Current state:** No test runner is configured in this repository.

When a test infrastructure is added, the following rules apply:

- **Test runner:** Vitest (preferred for tsup-based libraries).
- **React testing:** `@testing-library/react`.
- **HTTP mocking:** `msw` (Mock Service Worker).
- **Test location:** `src/__tests__/` mirroring the `src/` structure.
- **Behavior functions are pure/async** — test them without any Redux store,
  Zustand store, or QueryClient (no setup required).
- **Do not mock internal modules** — test behaviors by calling functions
  directly; mock only external boundaries (`IApiPort`, `IStoragePort`).
- **File naming:** `<name>.test.ts` or `<name>.spec.ts`.

Until a test infrastructure is in place, every refactor must be manually
verified against the `bidbox-user` consumer application.

---

## 12. Dependency Management

- `package.json` uses exact versions for `devDependencies` where possible to
  prevent silent upgrades breaking builds.
- State management libraries (`@reduxjs/toolkit`, `zustand`,
  `@tanstack/react-query`) are **peer dependencies** — never move them to
  regular `dependencies`.
- `axios` is a peer dependency. The HTTP layer must not call any Axios API
  that is not covered by the `RequestConfig` type.
- Do not add new runtime dependencies without explicit user instruction. The
  library's `dependencies` field in `package.json` must remain empty.
- Upgrading peer dependency ranges requires a minor or major version bump
  depending on whether the range change is breaking.

---

## 13. Documentation Rules

### 13.1 Source files

Write no JSDoc unless documenting a non-obvious behaviour, a public class, or
a complex type parameter. Single-line descriptions above exported functions are
acceptable when the function name is not fully self-explanatory.

### 13.2 README.md

`README.md` documents the **public developer-facing API**. It must be updated
when any of the following changes:

- Installation instructions
- Public export names or import paths
- Usage examples (ResourceConfig shape, hook signatures, provider props)
- Adapter list or adapter capabilities
- Migration notes

### 13.3 CHANGELOG.md

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning: [Semantic Versioning](https://semver.org/).

Structure:
```markdown
## [Unreleased]
### Added
### Changed
### Fixed
### Removed
### Deprecated
### Security

## [X.Y.Z] - YYYY-MM-DD
```

Every commit that affects behavior, public API, architecture, or documentation
must include a CHANGELOG entry in the `[Unreleased]` section.

### 13.4 Mintlify docs (`docs/`)

The `docs/` directory contains Mintlify MDX source. Update the relevant `.mdx`
files when:
- A new adapter or provider is added
- An existing hook signature changes
- A new configuration option is introduced
- Migration notes are needed

---

## 14. Git Workflow

### 14.1 Branching

- Default branch: `master`
- Feature branches: `feat/<short-description>`
- Bug fix branches: `fix/<short-description>`
- Refactor branches: `refactor/<short-description>`
- Documentation branches: `docs/<short-description>`

### 14.2 Commit message format (Conventional Commits)

```
<type>(<optional-scope>): <short imperative description>

<optional body — explain WHY, not WHAT>

<optional footer — breaking change notice or issue references>
```

**Types:**

| Type | When to use |
|---|---|
| `feat` | New user-facing feature or new public export |
| `fix` | Bug fix (behavior was wrong, now correct) |
| `refactor` | Internal restructuring — no behavior change, no API change |
| `docs` | README, CHANGELOG, MDX, or inline comment changes only |
| `chore` | Tooling, config, dependency updates, CI |
| `perf` | Performance improvement without behavior change |
| `test` | Test files added or modified |
| `build` | Changes to `tsup.config.ts`, `tsconfig.json`, `package.json` |

**Examples:**

```
feat(redux): add assembleReduxStore factory for focused store construction

refactor(behaviors): extract cache, auth, and persist logic into shared state layer

fix(saga): use shouldSkipFetch behavior for consistent cache-hit evaluation

docs: update README with ZustandProvider and TanstackProvider usage

chore: bump @reduxjs/toolkit peer dependency range to ^2.12
```

**Rules:**
- Subject line: max 72 characters, imperative mood, no trailing period.
- Body: wrap at 80 characters; explain motivation, not implementation.
- Breaking changes: add `BREAKING CHANGE:` footer with migration instructions.

---

## 15. AI Agent Workflow Rules

### 15.1 Before making changes

1. Read every file you intend to modify.
2. Identify all public exports affected by the change.
3. Verify the change does not alter any public API, import path, or runtime behavior.
4. If the change is architectural (new layer, new module, new pattern), present
   the plan to the user and wait for approval before writing code.

### 15.2 After making changes

After completing any repository modification, the AI agent **MUST**:

1. Provide a structured summary of all changes made:
   - Files created
   - Files modified (describe what changed internally)
   - Files deleted
   - Public API impact (must be "none" for refactors)
2. Confirm TypeScript passes: `yarn type-check` must show zero errors.
3. Ask the user for explicit confirmation before committing or pushing.

**Confirmation message template:**
> "Changes have been completed. Here is a summary of what was modified:
> [summary]. TypeScript reports zero errors. Do you want me to commit and
> push these updates to GitHub?"

The agent **MUST NOT** commit or push automatically without explicit user
approval.

### 15.3 If the user approves commit + push

Execute the following steps **in order**:

1. Update `CHANGELOG.md` — add entries to the `[Unreleased]` section
   describing every behavior, API, or architecture change.
2. Update `README.md` if any public API, usage example, or installation step
   changed.
3. Stage modified files explicitly (do not use `git add .` or `git add -A`
   blindly — exclude `.env`, build artifacts, and unrelated files).
4. Commit with a **Conventional Commits** message (see Section 14.2).
5. Push to the current branch.

### 15.4 Allowed actions (no user confirmation required)

An AI agent may perform the following without asking first:

- Read any file in the repository.
- Run `yarn type-check`, `yarn lint`, `yarn build` to verify correctness.
- Refactor internal code without changing exported symbols.
- Improve TypeScript type safety (narrowing, better generics, `satisfies`).
- Improve modular structure within the established layer hierarchy.
- Extract duplicated logic into `state/behaviors/` or `utils/`.
- Add backward-compatible export aliases.
- Add `ZustandProvider`-style provider components as additive exports.
- Add new entries to `CHANGELOG.md` under `[Unreleased]`.
- Update inline comments when behavior is genuinely non-obvious.

### 15.5 Disallowed actions (require explicit user instruction)

An AI agent **MUST NEVER** perform the following without explicit user
instruction:

| Action | Reason |
|---|---|
| Change any public export name, signature, or import path | Breaking change |
| Remove an existing public export without replacement | Breaking change |
| Change the shape of `ResourceState<T>` | Affects all consumers |
| Change `ResourceConfig` field names or types | Affects all resource maps |
| Change hook signatures (`useResourceDispatch`, `useResourceSelector`) | Affects all consumer hooks |
| Modify `StoreProvider`, `ZustandProvider`, or `TanstackProvider` props | Affects provider setup |
| Add a required dependency to `package.json#dependencies` | Changes install footprint |
| Commit or push to the repository | Requires user approval |
| Delete any source file without a replacement | Potentially breaking |
| Move cross-cutting logic out of `state/behaviors/` into adapter files | Architecture regression |
| Import from an adapter inside `core/`, `state/`, `http/`, or `storage/` | Layer violation |
| Use `@ts-ignore`, `@ts-nocheck`, or `any` in new public types | Type safety regression |
| Rewrite a module that already passes type-check without justification | Unnecessary churn |
| Modify `tsup.config.ts` or `package.json#exports` | Changes build output |
| Introduce a new peer dependency without discussion | Adds consumer burden |
| Push directly to `master` | Bypasses review |

### 15.6 When in doubt

If a requested change is ambiguous about whether it breaks backward
compatibility, **assume it does** and present the concern to the user before
proceeding.

---

## 16. Consumer App Reference (bidbox-user)

The `../bidbox-user` Next.js app is the canonical integration test for the
library. It follows the same hexagonal architecture:

```
bidbox-user/src/
├── core/          # Domain entities, port interfaces, use-case validators
├── infrastructure/
│   ├── api/       # Resource maps (*.resources.ts) + combined index
│   ├── store/     # createResources() call + typed hook re-exports
│   └── storage/   # storageByResource map
├── adapters/
│   ├── hooks/     # Domain hooks (useAuth, useUser, useBids)
│   ├── components/
│   │   ├── features/<domain>/  # Feature components
│   │   └── ui/                 # Base UI primitives
│   └── providers/ # StoreProvider wrapper
└── shared/        # ENV constants, common types, cn() utility
```

Path alias `@/*` resolves to `./src/*`.

When validating a library change, verify that `bidbox-user` still compiles and
the affected flows (auth, profile, bids) behave correctly.

---

## 17. Security Notes

- **Token storage:** `TokenManager` stores tokens in encrypted browser storage.
  This protects against accidental disclosure but not XSS. Advise consumers to
  prefer `httpOnly` cookies for production systems with sensitive auth flows.
- **Storage secret:** `ESTEDIO_STORAGE_SECRET` (or `NEXT_PUBLIC_STORAGE_SECRET`)
  must be set to a strong value in production. The library throws at runtime if
  the default secret is detected in production mode.
- **Vulnerability reporting:** See `SECURITY.md`. Do not open public issues for
  security vulnerabilities.
- **Dependency updates:** Keep all dependencies updated regularly. Run
  dependency audits as part of maintenance releases.

---

*Last updated: 2026-04-26 — reflects architecture as of v0.1.1 post-modernization refactor.*

# @estedio/react

Hexagonal resource primitives for React applications, with first-class adapters for Redux, Zustand, and TanStack Query.

## Overview

`@estedio/react` lets you define API resources once and plug them into the state library your app already uses. Each adapter exposes the same `ResourceState<T>` shape, shares the same HTTP and token-management runtime, and supports typed payload/response contracts.

Adapter entry points:

- `@estedio/react/redux`
- `@estedio/react/zustand`
- `@estedio/react/tanstack-query`

## Features

- Typed resource definitions with shared `ResourceConfig` and `ResourceState`
- Redux Toolkit + Redux Saga adapter for orchestrated async flows
- Zustand adapter for lightweight per-resource stores
- TanStack Query adapter for query/mutation-driven server state
- Shared auth token handling and 401 refresh flow
- Optional persisted resource hydration through encrypted storage adapters
- Provider helpers for all three adapters
- Shared error utilities via `NormalizedApiError`, `normalizeError`, and `isNormalizedApiError`

## Installation

Install the core package plus `axios`:

```bash
npm install @estedio/react axios
```

Then install the peer dependencies for the adapter you use:

```bash
npm install @reduxjs/toolkit react-redux redux-saga
```

```bash
npm install zustand
```

```bash
npm install @tanstack/react-query
```

Node.js `18+` is required.

## Configuration

Initialize the shared runtime once before fetching resources:

```ts
import { initializeLibConfig } from "@estedio/react/redux";

initializeLibConfig({
  apiBaseUrl: "https://api.example.com",
  refreshEndpoint: "/auth/refresh",
  accessTokenKey: "access_token",
  refreshTokenKey: "refresh_token",
  storageSecret: "replace-this-in-production",
});
```

You can also map snake_case values with `dataProvider`:

```ts
import { dataProvider, initializeLibConfig } from "@estedio/react/redux";

initializeLibConfig(
  dataProvider({
    base_url: "https://api.example.com",
    refresh_endpoint: "/auth/refresh",
    access_token_key: "access_token",
    refresh_token_key: "refresh_token",
    storage_secret: "replace-this-in-production",
  }),
);
```

## Defining Resources

```ts
import type { ResourceConfig } from "@estedio/react/redux";

type User = { id: number; name: string };
type CreateUserDto = { name: string; email: string };

export interface ResourceTypeMap {
  GetUsers: { payload: void; response: User[] };
  GetUserById: { payload: { userId: number }; response: User };
  CreateUser: { payload: CreateUserDto; response: User };
}

export const resources = {
  GetUsers: {
    endpoint: "/users",
    method: "GET",
    authenticated: true,
    payload: {} as void,
    response: {} as User[],
    meta: {
      persist: true,
      persistKey: "users_cache",
    },
  },
  GetUserById: {
    endpoint: "/users/:userId",
    method: "GET",
    authenticated: true,
    payload: {} as { userId: number },
    response: {} as User,
  },
  CreateUser: {
    endpoint: "/users",
    method: "POST",
    authenticated: true,
    payload: {} as CreateUserDto,
    response: {} as User,
  },
} satisfies Record<keyof ResourceTypeMap, ResourceConfig>;
```

## Usage

### Redux

```ts
import {
  createResources,
  createHooks,
  localStorageAdapter,
} from "@estedio/react/redux";
import { resources } from "./resources";
import type { ResourceTypeMap } from "./resources";

export const { makeStore, slices } = createResources(resources, {
  storageByResource: {
    GetUsers: localStorageAdapter,
  },
});

export const { useResourceDispatch, useResourceSelector } =
  createHooks<ResourceTypeMap>(slices);
```

```tsx
"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@estedio/react/redux";
import { makeStore } from "./store";

export function AppProvider({ children }: { children: ReactNode }) {
  return <StoreProvider makeStore={makeStore}>{children}</StoreProvider>;
}
```

### Zustand

```ts
import {
  createStore,
  createHooks,
  localStorageAdapter,
} from "@estedio/react/zustand";
import { resources } from "./resources";
import type { ResourceTypeMap } from "./resources";

const { stores } = createStore<ResourceTypeMap>(resources, {
  storageByResource: {
    GetUsers: localStorageAdapter,
  },
});

export const { useResourceDispatch, useResourceSelector } =
  createHooks<ResourceTypeMap>(stores);
```

```tsx
"use client";

import type { ReactNode } from "react";
import { ZustandProvider } from "@estedio/react/zustand";

export function AppProvider({ children }: { children: ReactNode }) {
  return <ZustandProvider>{children}</ZustandProvider>;
}
```

### TanStack Query

```tsx
"use client";

import { QueryClient } from "@tanstack/react-query";
import {
  createResources,
  TanstackProvider,
  localStorageAdapter,
} from "@estedio/react/tanstack-query";
import { resources } from "./resources";
import type { ResourceTypeMap } from "./resources";

const queryClient = new QueryClient();

export const { useResourceQuery, useResourceMutation } =
  createResources<ResourceTypeMap>(resources, {
    storageByResource: {
      GetUsers: localStorageAdapter,
    },
  });

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <TanstackProvider queryClient={queryClient}>{children}</TanstackProvider>
  );
}
```

## Common Interaction Patterns

```tsx
const dispatch = useResourceDispatch();
dispatch({ resource: "GetUsers", force: false });
dispatch({ resource: "GetUserById", force: true }, { userId: 42 });
```

```tsx
const { result, loading, error } = useResourceQuery({
  resource: "GetUsers",
  force: false,
});

const createUser = useResourceMutation("CreateUser");
createUser.dispatch({ name: "Alice", email: "alice@example.com" });
```

`force: false` skips the request when a non-null cached result already exists.

## Export Highlights

### Root package

- Core entities and ports
- Config helpers
- HTTP and storage runtime exports
- `normalizeError`
- `isNormalizedApiError`

### Adapter packages

- `createResources`
- `createStore` alias
- `createHooks` alias
- Provider components
- Storage adapters
- Token manager exports
- Adapter-specific factory types

## Documentation

- [Introduction](./docs/index.mdx)
- [Quickstart](./docs/quickstart.mdx)
- [Configuration](./docs/configuration.mdx)
- [Adapter overview](./docs/adapters/overview.mdx)
- [Redux guide](./docs/adapters/redux.mdx)
- [Zustand guide](./docs/adapters/zustand.mdx)
- [TanStack Query guide](./docs/adapters/tanstack-query.mdx)
- [Core API reference](./docs/api-reference/core.mdx)

## Migration Notes

Legacy import paths remain exported:

- `@estedio/react/store`
- `@estedio/react/hooks`

New code should prefer the adapter entry points directly.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting guidance.

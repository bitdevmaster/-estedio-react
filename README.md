# @estedio/react

Reusable hexagonal architecture utilities for resource-based data flows in React apps.

The package now ships adapter-specific entry points:

- `@estedio/react/redux`
- `@estedio/react/zustand`
- `@estedio/react/tanstack-query`

Use these paths directly for adapter features.

## Installation

Install the package and the adapter dependencies you use.

```bash
npm install @estedio/react axios
```

### Redux adapter dependencies

```bash
npm install @reduxjs/toolkit react-redux redux-saga
```

### Zustand adapter dependencies

```bash
npm install zustand
```

### TanStack Query adapter dependencies

```bash
npm install @tanstack/react-query
```

## Shared Configuration

All adapters export the same config helpers:

- `initializeLibConfig`
- `getLibConfig`
- `dataProvider`

### Runtime setup

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

### dataProvider (snake_case mapping)

```ts
import { dataProvider, initializeLibConfig } from "@estedio/react/redux";

const providerConfig = dataProvider({
  base_url: "https://api.example.com",
  refresh_endpoint: "/auth/refresh",
  access_token_key: "access_token",
  refresh_token_key: "refresh_token",
  storage_secret: "replace-this-in-production",
});

initializeLibConfig(providerConfig);
```

`dataProvider` maps only:

- `base_url`
- `refresh_endpoint`
- `access_token_key` (or deprecated `access_token`)
- `refresh_token_key` (or deprecated `refresh_token`)
- `storage_secret`

Note: `node_env` is intentionally not part of `dataProvider`.

## Resource Definition

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

## Redux Usage

### 1) Create resources/store

```ts
import { createResources, localStorageAdapter } from "@estedio/react/redux";
import { resources } from "./resources";

export const { makeStore, slices } = createResources(resources, {
  storageByResource: {
    GetUsers: localStorageAdapter,
  },
});
```

### 2) Provider

```tsx
"use client";

import type { ReactNode } from "react";
import { StoreProvider } from "@estedio/react/redux";
import { makeStore } from "./store";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <StoreProvider
      makeStore={makeStore}
      provider={{ apiBaseUrl: "https://api.example.com" }}
    >
      {children}
    </StoreProvider>
  );
}
```

### 3) Typed hooks

```ts
"use client";

import { createResourceHooks } from "@estedio/react/redux";
import { slices } from "./store";
import type { ResourceTypeMap } from "./resources";

export const { useResourceDispatch, useResourceSelector } =
  createResourceHooks<ResourceTypeMap>(slices);
```

### 4) Dispatch/select

```tsx
const dispatch = useResourceDispatch();
const { result, loading, error } = useResourceSelector("GetUsers");

dispatch({ resource: "GetUsers", force: false });
```

## Zustand Usage

```ts
"use client";

import {
  createResources,
  createResourceHooks,
  localStorageAdapter,
} from "@estedio/react/zustand";
import { resources } from "./resources";
import type { ResourceTypeMap } from "./resources";

const { stores } = createResources<ResourceTypeMap>(resources, {
  storageByResource: {
    GetUsers: localStorageAdapter,
  },
});

export const { useResourceDispatch, useResourceSelector } =
  createResourceHooks<ResourceTypeMap>(stores);

// usage:
// const dispatch = useResourceDispatch();
// dispatch({ resource: "GetUsers", force: false });
// const state = useResourceSelector("GetUsers");
```

## TanStack Query Usage

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createResources } from "@estedio/react/tanstack-query";
import { resources } from "./resources";
import type { ResourceTypeMap } from "./resources";

const queryClient = new QueryClient();
const { useResourceQuery, useResourceMutation } =
  createResources<ResourceTypeMap>(resources);

function Users() {
  const { result, loading, error } = useResourceQuery({
    resource: "GetUsers",
    force: false,
  });

  const createUser = useResourceMutation("CreateUser");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <button
      onClick={() => {
        createUser.dispatch({ name: "John", email: "john@example.com" });
      }}
    >
      Create user
    </button>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Users />
    </QueryClientProvider>
  );
}
```

## API Highlights

### ResourceState

```ts
type ResourceState<T> = {
  result: T | null;
  error: string | null;
  loading: boolean;
};
```

### ResourceConfig fields

- `endpoint`
- `method`: `"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "MULTIPART"`
- `authenticated`
- `meta.persist`
- `meta.persistKey`
- `meta.isAuthResource`
- `payload` (type marker)
- `response` (type marker)
- `sagaEffect` (Redux adapter behavior)

### Path params

`ResourceAdapter` interpolates endpoint params from payload:

- endpoint: `/users/:userId/posts/:postId`
- payload: `{ userId: 7, postId: 25, includeComments: true }`
- request URL: `/users/7/posts/25`
- forwarded payload: `{ includeComments: true }`

## Exports

### `@estedio/react`

Core/shared exports only:

- core entities and ports
- config helpers
- HTTP runtime exports
- storage exports

### `@estedio/react/redux`

- `createResources`
- `StoreProvider`
- `createResourceHooks`
- `useResourceSelector`
- `createResourceSlice`
- `createResourceSaga`
- `RootStateFromResources`
- `FetchPayload`
- shared config/adapters/types

### `@estedio/react/zustand`

- `createResources`
- `createResourceHooks`
- `createResourceStore`
- `ResourceStoresFromTypeMap`
- `ResourceDispatchParams`
- shared config/adapters/types

### `@estedio/react/tanstack-query`

- `createResources`
- `createResourceHooks`
- `TanstackResourceHooks`
- `QueryResourceResult`
- `MutationResourceResult`
- shared config/adapters/types

## Migration Notes

If you previously imported from legacy paths:

- `@estedio/react/store`
- `@estedio/react/hooks`

switch to adapter-specific paths instead:

- `@estedio/react/redux`
- `@estedio/react/zustand`
- `@estedio/react/tanstack-query`

## Security

For reporting vulnerabilities and security policies, see [SECURITY.md](./SECURITY.md).

Key points:

- Report security issues privately via GitHub Security Advisories.
- Tokens and secrets should use strong encryption and best-practice storage patterns.
- Keep all dependencies updated regularly.

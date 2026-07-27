---
name: dk-data-fetch
description:
  A skill for fetching and updating user data from an API, including mapping between API responses
  and domain models.
license: Apache-2.0
metadata:
  author: rodbe
  version: '1.0'
---

## Fetch Adapter

Sets up the HTTP infrastructure: a typed fetch utility (`fetch.ts`) and an adapter factory
(`index.ts`) that exposes GET, POST, PUT, DELETE, and PATCH methods with consistent error handling.
Follow the subsections in order — wrapper first, adapter second, then instantiate.

### Wrapper for fetch API with error handling and type definitions

Check `./src/infra/http/fetch.ts` — if it doesn't exist or is missing the exports `fetchWrapper`,
`RequestOptions`, or `FetchResponse`:

1. **Read** [references/fetch-wrapper.md](references/fetch-wrapper.md)
2. **Copy its content exactly as-is** into `./src/infra/http/fetch.ts` — do not paraphrase,
   simplify, or rewrite any part of it

Required before creating the Fetch adapter below.

### Fetch adapter

Check `./src/infra/http/index.ts` — if it doesn't exist or is missing the export `fetchAdapter`:

1. **Read** [references/fetch-adapter.md](references/fetch-adapter.md)
2. **Copy its content exactly as-is** into `./src/infra/http/index.ts` — do not paraphrase,
   simplify, or rewrite any part of it

It provides methods for making API calls (GET, POST, PUT, DELETE, PATCH).

### Create an instance of the Fetch adapter

Before making any API call, identify which adapter instance to use:

1. Read `./src/infra/http/index.ts` and list every exported `fetchAdapter(...)` instance found.
2. Ask the user: _"Which instance should be used for this endpoint?"_ — showing the list.
3. If the user says none fits or no instances exist, ask: _"What is the baseURL for this API?"_
   - Derive the instance name from the domain (e.g. `https://api.users.com` → `restUsersApi`).
   - Add the new instance to `./src/infra/http/index.ts` following the pattern below.

In: `./{projectRoot}/src/infra/http/index.ts`

```ts
export const restUserApi = fetchAdapter({
  baseURL: 'https://api.my-domain.com',
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_USER_API_TOKEN as string}`,
  },
});
```

## Define APIs calls

Full pipeline for integrating or refactoring an endpoint. Follow steps 0–6 in order. Code blocks are
examples — adapt domain name, fields, HTTP method, and URL to the actual use case. Ask the user for
any missing information (endpoint URL, request/response shape, domain name) before writing code.

**Import rule:** Derive the relative path from the file's location (e.g. an adapter at
`./src/repo/user/user.adapter.ts` importing from `./src/infra/http` uses `../../infra/http`).

---

### 0. Determine the domain

Before writing any code, confirm which domain the endpoint belongs to.

1. List existing domains by reading `./src/domain/` directories.
2. If the domain is unambiguous from context, proceed.
3. Otherwise, ask the user:

   > _"Which domain does this endpoint belong to? Existing domains: `{domain-a}`, `{domain-b}`, … —
   > pick one or provide a new name."_

Use the chosen domain name as `{domain}` throughout all steps below.

---

### 1. Domain Model

The frontend representation of the entity. Use camelCase, include only fields the UI needs. Check
`./src/domain/{domain}.model.ts` — extend it if the model already exists.

In: `./src/domain/{domain}.model.ts`

```ts
export interface User {
  birthday?: Date;
  id: number;
  lastName: string;
  name: string;
  demographicCohort?: 'millennial' | 'gen_z' | 'gen_x' | 'baby_boomer' | 'silent';
}
```

### 2. API Types

Raw shapes of the API contract. Use the exact field names from the API response/request. Name
pattern: `{Entity}{Action}{Response|Request}` — e.g. `UserFetchResponse`, `UserUpdateRequest`,
`UserDeleteRequest`, `UserDownloadResponse`. Check `./src/{domain}/{domain}Repo.port.ts` — add new
interfaces if the file exists.

**Rule:** `.port.ts` contains ONLY `interface` and `type` definitions — no `const`, no default
values, no runtime exports of any kind. If you need to export a constant (e.g. a default list, a
fallback value), put it in `./src/{domain}/{domain}.constants.ts` instead.

In: `./src/{domain}/repo/{domain}Repo.port.ts`

```ts
export interface UserFetchResponse {
  id: number;
  name: string;
  last_name: string;
  birthday?: Date;
}

export interface UserUpdateRequest {
  name: string;
  last_name: string;
}
```

### 3. Mapper

Translates between API types and domain model. `toDomain` maps API → UI; `toPersistence` maps UI →
API. Add computed fields here (e.g. derived from dates or combined fields). Check
`./src/repo/{domain}/{domain}.map.ts` — add new map objects if the file exists.

**Naming rule:** the map object name must match the adapter function that uses it, with `Map`
appended — e.g. adapter `fetchUsers` → `fetchUsersMap`; adapter `fetchDependabotAlerts` →
`fetchDependabotAlertsMap`.

In: `./src/repo/{domain}/{domain}.map.ts`

```ts
export const fetchUsersMap = {
  toDomain: (response: UserFetchResponse): User => ({
    id: response.id,
    name: response.name,
    lastName: response.last_name,
    birthday: response.birthday,
  }),
  toPersistence: (user: User): UserUpdateRequest => ({
    name: user.name,
    last_name: user.lastName,
  }),
};
```

### 4. Adapter

One function per endpoint. Each function calls the HTTP instance, applies the mapper, and returns
the domain type. Check `./src/repo/{domain}/{domain}.adapter.ts` — add new functions if the file
exists.

**Rule:** use `.then()` chains — no `async/await` or `try/catch` inside the function body.

In: `./src/repo/{domain}/{domain}.adapter.ts`

```ts
import { restUserApi } from '../../infra/http';
import { fetchUsersMap, updateUserMap } from './user.map';

export const fetchUsers = async (): Promise<User[]> =>
  restUserApi
    .get<UserFetchResponse[]>(`/v1/users`)
    .then((res) => res.json())
    .then((res) => res.map(fetchUsersMap.toDomain));

export const updateUser = async (userId: number, userData: User): Promise<User> =>
  restUserApi
    .put<UserFetchResponse>(`/v1/user/${userId}`, { body: updateUserMap.toPersistence(userData) })
    .then((res) => res.json())
    .then(updateUserMap.toDomain);
```

### 5. React Query Hook

Wraps the adapter in a `useQuery` or `useMutation`. One hook per logical operation. Expose only what
the component needs. Check `./src/repo/{domain}/{domain}.repo.ts` — add new hooks if the file
exists.

**Naming rule:** return React Query properties with their exact original names — never rename them
(e.g. do NOT rename `isFetching` → `loading`, `isError` → `error`, etc.). The only exception is
`data`, which may be aliased to a domain-meaningful name (e.g. `data: users`).

In: `./src/repo/{domain}/{domain}.repo.ts`

```ts
import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from './user.adapter';

export const useUsers = () => {
  const {
    data: users,
    isFetching,
    isError,
  } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  return { users, isFetching, isError };
};
```

### 6. Component usage

Invoke the hook at the top of the component. Handle loading and error states before rendering data.

```tsx
import { useUsers } from '../repo/user/user.repo';

const UserList = () => {
  const { users, isLoading, isError } = useUsers();
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading users.</div>;
  }

  return (
    <ul>
      {users?.map((u) => (
        <li key={u.id}>
          {u.name} {u.lastName}
        </li>
      ))}
    </ul>
  );
};
```

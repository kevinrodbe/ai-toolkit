# Template: `services/<domain>/`

Example with a fictional `todos` domain, consuming `restExampleApi` from `src/infra/http` (see [template-http.md](template-http.md)). See the layer's responsibility in [SKILL.md](../SKILL.md).

```ts
// todos.port.ts — types for the raw API request/response and the domain model
type TodoStatus = "new" | "wip" | "done";

export interface TodoResponse {
  completed: boolean;
  id: number;
  status: TodoStatus;
  todoTitle: string;
}

export type TodosResponse = TodoResponse[];

export interface FetchTodoRequest {
  idTodo: number;
  status?: TodoStatus;
}

export interface TodoResult {
  id: number;
  isDone: boolean;
  status: TodoStatus;
  title: string;
}

export interface SaveTodoRequest {
  todoTitle: string;
}

export type FetchTodos = () => Promise<TodoResult[]>;
export type FetchTodo = (
  req: Pick<TodoResult, "id" | "status">,
) => Promise<TodoResult>;
export type SaveTodo = (req: Pick<TodoResult, "title">) => Promise<TodoResult>;
```

### Type naming convention

- **Response** (raw API shape): `<Entity>Response` — e.g. `TodoResponse`, `TodosResponse`.
- **Request** (raw API input): `<AdapterName>Request` — named after the adapter function it belongs to, not the entity — e.g. `FetchTodoRequest`, `SaveTodoRequest`.
- **Result** (mapper output / domain model): `<Entity>Result` — e.g. `TodoResult`.

Follow this suffix consistently for every new `.port.ts`; don't invent alternatives (`TodoDto`, `TodoModel`, `TodoPayload`, etc.).

```ts
// todos.map.ts — pure function: raw API data <-> domain model
import type { Todo, TodoResponse } from "./todos.port";

export const fetchTodosMap = {
  toDomain: (todos: TodosResponse): TodoResult[] => {
    return todos.map(({ id, todoTitle, status }) => ({
      id,
      title: todoTitle,
      isDone: status === "done",
    }));
  },
};

export const fetchTodoMap = {
  toDomain: ({ id, todoTitle, status }: TodoResponse): TodoResult => {
    return { id, title: todoTitle, status, isDone: status === "done" };
  },
  toPersistance: ({
    id,
    status,
  }: Pick<TodoResult, "id" | "status">): FetchTodoRequest => {
    return { idTodo: id, status: status };
  },
};

export const saveTodoMap = {
  toDomain: ({ id, todoTitle, status }: TodoResponse): TodoResult => {
    return { id, title: todoTitle, status, isDone: status === "done" };
  },
  toPersistance: ({ title }: Pick<TodoResult, "title">): SaveTodoRequest => {
    return { todoTitle: title };
  },
};
```

---

```ts
// todos.adapter.ts — calls the client from src/infra/http, typed with .port.ts, no data transformation
import { restExampleApi } from "@/infra/http";
import type { FetchTodo, TodoResponse } from "./todos.port";

export const fetchTodo: FetchTodo = async (req) => {
  return restExampleApi
    .get<TodoResponse>("/todo", { params: fetchTodoMap.toPersistance(req) })
    .then((res) => res.json())
    .then(fetchTodoMap.toDomain);
};

export const saveTodo: SaveTodo = async (req) => {
  return restExampleApi
    .post<TodoResponse>("/todo", { body: saveTodoMap.toPersistance(req) })
    .then((res) => res.json())
    .then(saveTodoMap.toDomain);
};
```

```ts
// todos.service.ts — @tanstack/react-query hook that consumes the adapter
import {
  useQuery,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";

import { useApiAdapterContext } from "@/common/context/ApiAdapterContext";
import type { TodoResult } from "./todos.port";

export const useFetchTodo = (
  { id, status }: TodoResult,
  opts?: Omit<UseQueryOptions<TodoResult>, "queryKey" | "queryFn">,
) => {
  const { fetchTodo } = useApiAdapterContext();

  const {
    data: todo,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    ...opts,
    queryKey: ["todo", id, status],
    queryFn: () => fetchTodo({ id, status }),
  });

  return { todo, isFetching, isError, error, refetch };
};

export const useSaveTodo = (
  opts: Omit<
    UseMutationOptions<TodoResult[], Error, Parameters<SaveTodo>[0]>,
    "mutationFn"
  > = {},
) => {
  const { saveTodo } = useApiAdapterContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveTodo,
    ...opts,
    onSuccess: (response, props, onMutateResult, contcontext) => {
      opts.onSuccess?.(response, props, onMutateResult, contcontext);

      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
};
```

```ts
// index.ts — public API of the service group; useCases only ever imports from here
export * from "./todos.port";
export * from "./todos.service";
```

---

## Mandatory registration in `ApiAdapterContext`

`todos.service.ts` doesn't call `todos.adapter.ts` directly: it gets the function via `useApiAdapterContext()` (see `src/common/context/ApiAdapterContext/`). This means **creating the `.adapter.ts` isn't enough** — the adapter isn't available until it's registered in the context. After writing `<domain>.adapter.ts`, always complete these two steps:

1. **Add the adapter's type to `ApiAdapterContext.types.ts`** (`src/common/context/ApiAdapterContext/ApiAdapterContext.types.ts`), importing the type from the service group's `index.ts`:

   ```ts
   // ApiAdapterContext.types.ts
   import type { FetchTodos, SaveTodo } from "@module/todos/services/todos";

   interface ApiAdapterState {
     fetchTodos: FetchTodos;
     saveTodo: SaveTodo;
     // + one field per new adapter a service exposes
   }

   export type ApiAdapterContextValue = ApiAdapterState;
   ```

2. **Pass the real implementation as the `adapters` prop of `ApiAdapterProvider`**, where it's mounted (e.g. `src/App.tsx`):

   ```tsx
   <ApiAdapterProvider
     adapters={{
       fetchTodos: fetchTodos,
       saveTodo: saveTodo, // the adapter just created in todos.adapter.ts
     }}
   >
     <RouterProvider router={router} />
   </ApiAdapterProvider>
   ```

Checklist when finishing a `services/<domain>/`:

- [ ] Does `.service.ts` consume the adapter via `useApiAdapterContext()` instead of importing `<domain>.adapter.ts` directly?
- [ ] Did I add the new adapter's type to `ApiAdapterState` in `ApiAdapterContext.types.ts`?
- [ ] Did I pass the adapter's implementation in the `adapters` prop of `ApiAdapterProvider` where the app is mounted?

If `ApiAdapterContext` doesn't exist yet in the project (first time this skill is used in that repo), create it with the 5 fixed files of a context (see [template-context.md](template-context.md)) before writing the `.service.ts`, since the latter depends on `useApiAdapterContext`.

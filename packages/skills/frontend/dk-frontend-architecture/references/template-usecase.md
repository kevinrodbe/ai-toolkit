# Template: `useCases/use<UseCase>UseCase.ts`

Orchestrates a `service` (TanStack Query, see [template-service.md](template-service.md)) and optionally a `store` (see [template-store.md](template-store.md)); never calls `fetch`/adapter directly, contains no JSX. See the layer's responsibility in [SKILL.md](../SKILL.md).

## Rule: one custom hook per system use case

Each **system use case** you identify in the requirement (or that the user explicitly tells you) is implemented as its own custom hook in `useCases/`, named `use<UseCase>UseCase`. Examples: user login → `useLoginUseCase.ts`; list repos → `useFetchAllReposUseCase.ts`; add a repo → `useAddRepoUseCase.ts`. Don't group several distinct use cases into a single hook, even if they share a `service`/`store`.

The consuming component/page only does two things with the hook: **(1)** passes it the user's data/events as arguments or by calling the functions it returns, and **(2)** executes or renders what the hook returns (loading, data, error, handlers). The component doesn't decide business conditionals, doesn't transform data, doesn't call `services`/`store` directly — that lives inside the `useCase`.

```ts
// useLoginUseCase.ts
import { useLoginService } from "../services/auth";
import { useSetUser } from "../store";

export const useLoginUseCase = () => {
  const { mutate, isPending, error } = useLoginService();
  const setUser = useSetUser();

  const login = (email: string, password: string) => {
    mutate({ email, password }, { onSuccess: (user) => setUser(user) });
  };

  return { login, isPending, error };
};
```

```ts
// useFetchAllReposUseCase.ts
import { useReposService } from "../services/repos";

export const useFetchAllReposUseCase = () => {
  const { data, isLoading, error } = useReposService();

  return { repos: data ?? [], isLoading, error };
};
```

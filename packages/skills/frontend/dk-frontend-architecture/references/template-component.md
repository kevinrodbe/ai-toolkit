# Template: `pages/<PageOne>/` and `_components/<Compo1>/`

Page component (or page-scoped sub-component), with PandaCSS styles and no business logic: receives user input and delegates it to the `useCase` (see [template-usecase.md](template-usecase.md)). Same 4-file pattern for `_components/<Compo1>/`. See the layer's responsibility in [SKILL.md](../SKILL.md).

## Rule: the component has no logic, it only calls the useCase

The page/component **contains no business or system logic** (domain conditionals, data transformations, calls to `services`/`store`). For each use case the screen needs, it consumes its custom hook `use<UseCase>UseCase` (see [template-usecase.md](template-usecase.md)) and limits itself to:

1. Sending the hook the user's data/events (form inputs, clicks, route params, etc.), either as hook arguments or by calling the functions it returns.
2. Executing or rendering exactly what the hook returns (`isLoading`, `data`, `error`, handlers) — without reinterpreting or recomputing those values in the component.

```tsx
// LoginPage.tsx (fragment)
import { useLoginUseCase } from "../../useCases/useLoginUseCase";

export const LoginPage = () => {
  const { login, isPending, error } = useLoginUseCase();

  const handleSubmit = (email: string, password: string) => {
    login(email, password); // the component only forwards the input, it doesn't validate or decide anything
  };

  // ...renders using isPending/error exactly as returned by the useCase
};
```

## Rules

- Define the props interface in the same file, prefixed with the component name (`SiteCardProps`, `MapInfoWindowProps`).
- Import `Typography` from `antd` when displaying text.
- Import only `type { ReactNode }` (not `React`) when `children` or render props are needed.
- Order props alphabetically both in the interface and in the destructuring.
- Use semantic HTML tags (`section`, `article`, etc.) where appropriate.
- Use design tokens for spacing, colors, etc. Use the `[rawValue]` syntax only when no token exists.
- Name styled components descriptively: `MainBox`, `HeaderBox`, `ContentArea`, etc.
- Order CSS properties alphabetically within each `base`/variant object of `cva`.
- For variants, use the `cva` `variants` API.
- Each styled element follows the pattern: `const xxxStyle = cva({ base: { ... } })` then `export const Xxx = styled('htmlTag', xxxStyle)`.

```ts
// TodosPage.styles.ts
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

const mainBoxStyle = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
    padding: "xs",
  },
  variants: {
    size: {
      md: { padding: "md" },
      sm: { padding: "sm" },
    },
  },
});

const listItemStyle = cva({
  base: {
    color: "gray.700",
    fontSize: "sm",
  },
});

export const MainBox = styled("section", mainBoxStyle);
export const ListItem = styled("li", listItemStyle);
```

```tsx
// TodosPage.tsx
import { Typography } from "antd";
import type { ReactNode } from "react";

import { useFetchAllTodosUseCase } from "../../useCases/useFetchAllTodosUseCase";
import { ListItem, MainBox } from "./TodosPage.styles";

const { Title, Text } = Typography;

interface TodosPageProps {
  emptyState?: ReactNode;
  title: string;
}

export const TodosPage = ({ emptyState, title }: TodosPageProps) => {
  const { todos, isLoading } = useFetchAllTodosUseCase();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <MainBox size="md">
      <Title level={5}>{title}</Title>
      {todos.length === 0 && emptyState}
      <ul>
        {todos.map((todo) => (
          <ListItem key={todo.id}>{todo.title}</ListItem>
        ))}
      </ul>
    </MainBox>
  );
};
```

```ts
// index.ts
export * from "./TodosPage";
```

`.types.ts` is optional: only add it when the component grows or has many of its own types; in that case it lives alongside the other files with the same base name (`TodosPage.types.ts`).

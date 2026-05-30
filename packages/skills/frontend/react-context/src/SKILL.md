---
name: react-context
description: >
  React Context creation with TypeScript — State + Actions separation, typed Provider, and typed hook with guard.
  Invoke when the user asks for a context/provider/hook, or when the AI detects that state or services need to be shared across a component tree without prop drilling.
metadata:
  version: "0.2.0"
---

## Elicitation

Infer name, directory, state shape, actions, and placement from the user's message and project structure. Ask only when a type's file path cannot be located in the codebase — a wrong relative path in `import type` will silently break the build. Batch all open questions into a single message.

---

## File structure

```
<Dir>/<Name>Context/
├── <Name>Context.ts            ← createContext only
├── <Name>Context.types.ts      ← State, Actions, <Name>ContextValue
├── <Name>Provider.tsx          ← Provider component
├── use<Name>Context.ts         ← typed hook with guard
└── index.ts                    ← barrel: Provider + hook (NOT raw context, NOT types)
```

---

## File templates

### `<Name>Context.types.ts`

```typescript
interface <Name>State {
  theme: "light" | "dark";
  primaryColor: string;
  secondaryColor: string;
}

interface <Name>Actions {
  toggleTheme: () => void;
}

export type <Name>ContextValue = <Name>State & <Name>Actions;
```

Rules:

- `<Name>State` = read-only values (booleans, data, config, refs)
- `<Name>Actions` = functions that mutate or trigger effects
- `<Name>ContextValue = <Name>State & <Name>Actions` — always an intersection, never a merged single interface
- Import types with `import type`, never plain `import` for type-only imports
- **Do not export individual field types** Any consumer that needs a field's type uses `<Name>ContextValue["fieldName"]` — `<Name>ContextValue` is the single access point for all types in the context.

---

### `<Name>Context.ts`

```typescript
import { createContext } from 'react';

import type { <Name>ContextValue } from './<Name>Context.types';

export const <Name>Context = createContext<<Name>ContextValue | undefined>(undefined);
```

Rules:

- Initial value is always `undefined` — the hook guard handles the missing-provider case
- No logic here, only `createContext`

---

### `<Name>Provider.tsx`

Two variants. Choose based on **who owns the state**:

#### Variant A — self-contained (provider owns state)

Use when the state only makes sense inside the context (theme, locale, modals, notifications). No prop needed beyond `children`.

```typescript
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { <Name>Context } from './<Name>Context';
import type { <Name>ContextValue } from './<Name>Context.types';

type <Name>ProviderProps = {
  children: ReactNode;
};

export const <Name>Provider = ({ children }: <Name>ProviderProps) => {
  const [<stateVar>, set<StateVar>] = useState<<Name>ContextValue["<stateVar>"]>(<initialValue>);

  const value = useMemo(
    () => ({
      <stateVar>,
      <action>: () => set<StateVar>(<nextValue>),
      <derivedField>: <stateVar> === <caseA> ? <valueA> : <valueB>,
    }),
    [<stateVar>]
  );

  // React ≥ 19
  return <<Name>Context value={value}>{children}</<Name>Context>;
  // React 18
  // return <<Name>Context.Provider value={value}>{children}</<Name>Context.Provider>;
};
```

#### Variant B — pass-through (caller owns state)

Use when state ownership belongs at a higher level — either inferred from the request or because external systems also write to it (e.g. a counter driven by a form, auth state from a router).

```typescript
import type { ReactNode } from 'react';

import { <Name>Context } from './<Name>Context';
import type { <Name>ContextValue } from './<Name>Context.types';

type <Name>ProviderProps = {
  children: ReactNode;
  <propName>: <Name>ContextValue;
};

export const <Name>Provider = ({ children, <propName> }: <Name>ProviderProps) => {
  // React ≥ 19
  return <<Name>Context value={<propName>}>{children}</<Name>Context>;
  // React 18
  // return <<Name>Context.Provider value={<propName>}>{children}</<Name>Context.Provider>;
};
```

Rules (both variants):

- **React version detection (required):** Read `package.json` → `dependencies.react` to determine the installed version before generating the return statement:
  - React ≥ 19 → `<Context value={...}>` (no `.Provider` wrapper)
  - React 18 → `<Context.Provider value={...}>...</Context.Provider>`
  - If `package.json` is absent or the version is ambiguous, default to the React 18 form (broadest compatibility)
- Variant A: wrap the value in `useMemo`, list every piece of state in deps to prevent unnecessary consumer re-renders; derive computed fields inside `useMemo`
- Variant B: The provider is a thin pass-through; zero business logic lives here. `<Name>ContextValue` is the single source of truth for the prop type — never duplicate fields; **`<propName>`**: choose a semantic name (`adapters`, `config`, `services`); use `value` only when State holds generic UI config with no better name

---

### `use<Name>Context.ts`

```typescript
import { useContext } from 'react';

import { <Name>Context } from './<Name>Context';

export const use<Name>Context = () => {
  const context = useContext(<Name>Context);

  if (context === undefined) {
    throw new Error('use<Name>Context must be used within a <Name>Provider');
  }

  return context;
};
```

Rules:

- Guard pattern is mandatory — always `throw new Error` with the canonical message
- Return the raw `context` (already typed as `<Name>ContextValue` after the guard)
- No `useMemo`, no selectors here — keep the hook minimal

---

### `index.ts` (barrel)

```typescript
export * from "./<Name>Provider";
export * from "./use<Name>Context";
```

Rules:

- Export the Provider and the hook only
- Do NOT re-export the raw `<Name>Context` object or the types

## When to Use This Skill

Use react-context-patterns when you need to:

- Share state across many components without prop drilling
- Implement global application state (auth, theme, etc.)
- Build provider patterns for complex features
- Create compound components with shared state
- Manage deeply nested component communication
- Implement feature-specific state management
- Build scalable React applications
- Avoid excessive prop passing
- Create reusable context patterns
- Manage cross-cutting concerns (notifications, modals, etc.)

## Best Practices

1. **Split contexts by concern** - Create separate contexts for auth, theme,
   cart, etc. Don't combine unrelated state.

2. **Memoize context values** - Use `useMemo` to prevent unnecessary re-renders
   when the provider re-renders.

3. **Provide custom hooks** - Always create a custom hook like `useAuth()`
   instead of exposing `useContext()` directly.

4. **Throw errors outside provider** - Ensure context is used within the correct
   provider boundary.

5. **Use TypeScript** - Define proper types for context values to catch errors
   at compile time.

6. **Keep values stable** - Avoid creating new objects/functions on every render.
   Use `useMemo` and `useCallback`.

7. **Split read and write contexts** - For performance-critical applications,
   separate state and dispatch contexts.

8. **Document context usage** - Clearly document what each context provides and
   when to use it.

9. **Test thoroughly** - Write tests for providers, custom hooks, and error cases.

10. **Consider alternatives** - Don't use Context for everything. Local state,
    prop passing, or state management libraries might be better for some cases.

## Common Pitfalls

1. **Creating too many contexts** - Context hell is as bad as prop drilling.
   Group related state together.

2. **Not memoizing values** - Every provider re-render causes all consumers to
   re-render if values aren't memoized.

3. **Using context for all state** - Local state is simpler and more performant
   for component-specific state.

4. **Forgetting error boundaries** - Always check if context exists in custom
   hooks to provide helpful error messages.

5. **Not providing defaults** - Always handle the undefined case when context
   might not be available.

6. **Overusing for performance** - Context causes all consumers to re-render.
   For frequently changing values, consider alternatives.

7. **Not splitting operations** - Separating read and write can significantly
   improve performance.

8. **Creating unstable values** - Defining objects or functions inline in the
   provider causes unnecessary re-renders.

9. **Using for high-frequency updates** - Context isn't optimized for values
   that change many times per second.

10. **Not considering composition** - Sometimes lifting state up or using
    composition patterns is simpler than context.

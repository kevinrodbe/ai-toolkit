# Template: `context/<Xxxx>Context/`

The 5 fixed files of a Context, with a fictional `Feedback` example (showing global modals/alerts). Same pattern applies to a context scoped to a page (`pages/<PageOne>/context/<Yyyy>Context/`). See the layer's responsibility in [SKILL.md](../SKILL.md).

## File templates

### `<Name>Context.types.ts`

```ts
// FeedbackContext.types.ts
export interface FeedbackState {
  msgAlert: string;
}

interface FeedbackActions {
  showAlert: (message: string) => void;
}

export type FeedbackContextValue = FeedbackState & FeedbackActions;
```

Rules:

- `<Name>State` = read-only values (booleans, data, config, refs) — **exported**, since consumers may need to know the shape of the state values on their own (e.g. to type a prop, a selector, or a piece of local state mirroring it)
- `<Name>Actions` = functions that mutate or trigger effects — kept internal, not exported
- `<Name>ContextValue = <Name>State & <Name>Actions` — always an intersection, never a merged single interface
- Import types with `import type`, never plain `import` for type-only imports
- **Do not export individual field types beyond `<Name>State`** Any consumer that needs an action's type or a single field uses `<Name>ContextValue["fieldName"]` — `<Name>ContextValue` remains the single access point for everything except the plain state shape, which lives in `<Name>State`.

---

### `<Name>Context.ts`

```ts
// FeedbackContext.ts
import { createContext } from "react";

import type { FeedbackContextValue } from "./FeedbackContext.types";

export const FeedbackContext = createContext<FeedbackContextValue | undefined>(
  undefined,
);
```

Rules:

- Initial value is always `undefined` — the hook guard handles the missing-provider case
- No logic here, only `createContext`

---

### `<Name>Provider.tsx`

Two variants. Choose based on **who owns the state**.

**How to choose:** does the context's initial state depend on something external to the provider itself (route params, a parent form, another store, the response of a fetch done higher up the tree)? → Variant B. Does the state originate and live entirely inside the provider (theme, locale, modals, notifications)? → Variant A.

#### Variant A — self-contained (provider owns state)

Use when the state only makes sense inside the context (theme, locale, modals, notifications). No prop needed beyond `children`.

```tsx
// FeedbackProvider.tsx
import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { FeedbackContext } from "./FeedbackContext";

export const FeedbackProvider = ({ children }: PropsWithChildren) => {
  const [msgAlert, setMsgAlert] = useState("");

  const showAlert = useCallback((message: string) => {
    setMsgAlert(message);
    // implementation (e.g. show a modal from the UI library)
  }, []);

  const value = useMemo(() => ({ msgAlert, showAlert }), [msgAlert, showAlert]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};
```

#### Variant B — pass-through (caller owns state)

Use when state ownership belongs at a higher level — either inferred from the request or because external systems also write to it. Example: a `CounterContext` whose value is controlled by a parent form.

```tsx
// CounterProvider.tsx
import type { ReactNode } from "react";

import { CounterContext } from "./CounterContext";
import type { CounterContextValue } from "./CounterContext.types";

type CounterProviderProps = {
  children: ReactNode;
  counter: CounterContextValue;
};

export const CounterProvider = ({
  children,
  counter,
}: CounterProviderProps) => {
  // React ≥ 19
  return <CounterContext value={counter}>{children}</CounterContext>;
  // React 18
  // return <CounterContext.Provider value={counter}>{children}</CounterContext.Provider>;
};
```

Note: React version detection (next rule) only affects the Provider's `return`. `<Name>Context.ts` and `use<Name>Context.ts` don't change between React 18 and ≥19.

Rules (both variants):

- **React version detection (required):** Read `package.json` → `dependencies.react` to determine the installed version before generating the return statement:
  - React ≥ 19 → `<Context value={...}>` (no `.Provider` wrapper)
  - React 18 → `<Context.Provider value={...}>...</Context.Provider>`
  - If `package.json` is absent or the version is ambiguous, default to the React 18 form (broadest compatibility)
- Variant A: wrap the value in `useMemo`, list every piece of state in deps to prevent unnecessary consumer re-renders; derive computed fields inside `useMemo`
- Variant B: The provider is a thin pass-through; zero business logic lives here. `<Name>ContextValue` is the single source of truth for the prop type — never duplicate fields; **`<propName>`**: choose a semantic name (`adapters`, `config`, `services`); use `value` only when State holds generic UI config with no better name

---

### `use<Name>Context.ts`

```ts
// useFeedbackContext.ts
import { useContext } from "react";
import { FeedbackContext } from "./FeedbackContext";

export const useFeedbackContext = () => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error(
      "useFeedbackContext must be used within a FeedbackProvider",
    );
  }
  return ctx;
};
```

Rules:

- Guard pattern is mandatory — always `throw new Error` with the canonical message
- Return the raw `context` (already typed as `<Name>ContextValue` after the guard)
- No `useMemo`, no selectors here — keep the hook minimal

---

### `index.ts` (barrel)

```ts
// index.ts
export * from "./useFeedbackContext";
export * from "./FeedbackContext.types";
export { FeedbackProvider } from "./FeedbackProvider";
```

Rules:

- Export the Provider, the hook, and the types (`<Name>Context.types.ts`) — these three are the public API
- Do NOT re-export the raw `<Name>Context` object (`<Name>Context.ts`) — consumers must go through the hook, never `useContext(<Name>Context)` directly

## Best Practices

1. **Split contexts by concern** - Create separate contexts for auth, theme,
   cart, etc. Don't combine unrelated state.

2. **Consider alternatives** - Don't use Context for everything. Local state,
   prop passing, or state management libraries might be better for some cases.
   Context re-renders every consumer on change — avoid it for high-frequency
   updates.

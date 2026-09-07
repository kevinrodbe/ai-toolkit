---
name: dk-frontend-architecture
description: Architecture and folder-structure convention for frontend projects using React + TanStack Query + Zustand + PandaCSS (layered/module architecture: context, store, services with ports/adapters, useCases, pages). Use it ALWAYS when creating, moving, or reviewing src/ code in a project that follows this convention — new module/feature, component, hook, service, store, context, page, or util — to decide which folder each file belongs in and how to name it.
metadata:
  version: '0.0.1'
---

# Frontend Architecture

Layered architecture convention for React projects using TanStack Query, Zustand, and PandaCSS.

## 1. Naming

- Constants file: `xxxx.constants.ts`
- Each "unit" (context, hook, layout, page, component, service-group) lives in **its own folder** with an `index.ts` that re-exports its public API.
- Folder names in PascalCase for Context/Page/Component (`FeedbackContext`, `PageOne`, `Compo1`); camelCase for hooks (`useXxxx`) and for service/module groups (`moduleOne`, `auth`).
- Each file in `useCases/` is a custom hook named `use<UseCase>UseCase` (e.g. `useLoginUseCase.ts` for the "user login" use case, `useFetchAllReposUseCase.ts` for "list repos"). See section 3 and [template-usecase.md](references/template-usecase.md).

## 2. Decision tree: where does this file go?

1. **Is it cross-cutting across the whole app (not tied to a business domain)?**
   - Low-level wrapper/adapter for an external library (fetch, etc.) → `src/infra/<domain>/` (template: [references/template-http.md](references/template-http.md))
   - Global type augmentation → `src/@types/<context>.d.ts`
   - Context/hook/layout/util reused across modules, with no business logic → `src/common/{context,hooks,layouts,utils}/`
   - Configuration for a library (react-query, mui, i18n) → `src/config/`
2. **Does it belong to a business domain (auth, payroll, reporting, sctr, repos, etc.)?**
   → `src/modules/<moduleName>/...` — see section 3.
3. **Is it just a type (`.types.ts`) or style (`.styles.ts`) file for a component/page you've already identified?**
   → Lives alongside that file, same base name, not in a separate folder.

Quick rule: if the file imports or composes JSX specific to a business screen, it goes in `pages` or in `_components` of that page. If it defines _what happens_ when the user acts (orchestrates hooks/services/store), it goes in `useCases`. If it calls the backend, it goes in `services`. If it's shared module state, it goes in `store`.

## 3. Inside `src/modules/<moduleName>/`

| Folder                                   | Responsibility                                | Key rule                                                                                                                                                                                                                                                                                 | Template                                                  |
| ---------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `context/<Xxxx>Context/`                 | React context scoped to the module            | 5 fixed files: `index.ts`, `<Xxxx>Context.ts`, `<Xxxx>Context.types.ts`, `<Xxxx>Provider.tsx`, `use<Xxxx>Context.ts`                                                                                                                                                                     | [template-context.md](references/template-context.md)     |
| `store/`                                 | Module global state with Zustand              | `<name>.store.ts` per store; `index.ts` exports **facades** (custom hook with selector), never the raw store                                                                                                                                                                             | [template-store.md](references/template-store.md)         |
| `services/<domain-or-context-name>/`     | Data access, grouped by context/domain        | 4 files: `.port.ts` (adapter/fetcher types), `.map.ts` (data transform), `.adapter.ts` (pure fetch), `.service.ts` (`@tanstack/react-query` hook that consumes the adapter via `useApiAdapterContext()`, never importing it directly)                                                    | [template-service.md](references/template-service.md)     |
| `useCases/`                              | Intermediary between components and app logic | **One custom hook per system use case** you identify or are told to implement, named `use<UseCase>UseCase.ts` (e.g. `useLoginUseCase.ts`); orchestrates services + store + conditionals; **never** calls `fetch`/adapter directly                                                        | [template-usecase.md](references/template-usecase.md)     |
| `pages/<PageOne>/`                       | Screen components                             | **Zero business or system logic**: only forwards the user's data/events to the corresponding `useCase` (`use<UseCase>UseCase`) and executes or renders what that hook returns. `index.ts`, `<PageOne>.tsx`, `.styles.ts` (PandaCSS), `.types.ts` (optional, only if the component grows) | [template-component.md](references/template-component.md) |
| `pages/<PageOne>/_components/<Compo1>/`  | Sub-components used only by that page         | Same 4-file pattern as a page                                                                                                                                                                                                                                                            | [template-component.md](references/template-component.md) |
| `pages/<PageOne>/context/<Yyyy>Context/` | Context scoped only to that page              | Same pattern as module-level `context/`, but lives inside the page                                                                                                                                                                                                                       | [template-context.md](references/template-context.md)     |

Allowed dependency direction, one way only: `pages` → `useCases` → (`services` + `store` + `context`). A `service` never imports from `useCases` or `pages`.

Before writing a file in one of these layers for the first time in a project, open the corresponding template from the table — the concrete content of each one isn't obvious just from the file name.

## 4. `services/<domain-or-context-name>/` pattern in detail

```
<domain-or-context-name>.port.ts     // types: adapter request/response, types used by map
<domain-or-context-name>.map.ts      // pure functions: raw API data -> domain model
<domain-or-context-name>.adapter.ts  // function(s) that call the fetch adapter from src/infra/http, typed with .port.ts
<domain-or-context-name>.service.ts  // useQuery/useMutation hook(s) that get the adapter via useApiAdapterContext() and apply the map
index.ts           // re-exports everything from *.port.ts and *.service.ts, so useCases only ever imports from here
```

`src/infra/http` must expose ready-to-consume client instances for adapters (baseURL + headers fixed per external API domain), not a new `fetch` per adapter. See [template-service.md](references/template-service.md) and [template-http.md](references/template-http.md).

A `.service.ts` **never** imports its `.adapter.ts` directly: it gets the function through `useApiAdapterContext()` (`src/common/context/ApiAdapterContext/`). Because of this, creating the adapter isn't the final step — each new adapter must also be registered in `ApiAdapterContext.types.ts` (a field in `State`) and passed as the `adapters` prop of `ApiAdapterProvider` where the app is mounted (e.g. `src/App.tsx`). See the full detail in the final section of [template-service.md](references/template-service.md).

## 5. Checklist before creating a new file

- [ ] Did I already pick the correct folder using the decision tree (section 2)?
- [ ] Does the file name follow the naming convention suffix (`.types.ts`, `.styles.ts`, `.store.ts`, `.port.ts`, `.map.ts`, `.adapter.ts`, `.service.ts`, `.constants.ts`)?
- [ ] Does it have an `index.ts` if it's a unit folder (context, hook, layout, page, component, service-group)?
- [ ] Am I putting business logic in `pages`/`_components`? → If so, move it to a `useCase` (`use<UseCase>UseCase`).
- [ ] Did I identify (or was I told about) a new system use case (login, fetch data, save, filter, etc.)? → Create its own custom hook in `useCases/use<UseCase>UseCase.ts`; don't mix it into another useCase or write it inline in the page.
- [ ] Is a `service` importing from `store` or `useCases`? → It shouldn't; invert the dependency.
- [ ] **Is this the first time this type of file is being created in the project (infra/http, context, store, service, useCase, page/component)?** → Open the corresponding template from the "Template" column (section 3) or [template-http.md](references/template-http.md) before writing the file; don't guess the shape of the code.

## 6. Next.js projects (App Router)

This convention also applies to Next.js projects. Everything in sections 1-5 stays the same — the only difference is where routing lives.

- Next.js's `app/` router owns **routing only**: `app/<route>/page.tsx` and `app/<route>/layout.tsx` files must stay minimal — they define the route segment (and optional layout/loading/error boundaries) and immediately render the real screen component from `src/modules/<moduleName>/pages/<PageOne>/`. They contain no business/system logic, no data fetching, no styling beyond what Next.js requires structurally.
- The actual screen — markup, styles, use case wiring — is still built as `src/modules/<moduleName>/pages/<PageOne>/` exactly per section 3. Nothing changes in `pages/`, `_components/`, `useCases/`, `services/`, `store/`, or `context/`.
- Mapping rule: a URL segment `app/<route>/page.tsx` renders the module page component, it does not reimplement it:

  ```tsx
  // app/<route>/page.tsx
  import { PageOne } from "@/modules/<moduleName>/pages/PageOne";

  export default function Page() {
    return <PageOne />;
  }
  ```

- Route params/searchParams: read them in `app/<route>/page.tsx` (per Next.js's App Router API) and pass them down as props to the module's page component — the module page still receives plain props, it never imports `next/navigation` or reads the URL itself. Route-level data fetching still goes through a `useCase`, not through the `app/` file.
- `layout.tsx` files map to `src/common/layouts/` (cross-cutting layout, e.g. `Dashboard`, `NoAuth`) or a module/page-scoped equivalent — the `app/<route>/layout.tsx` file itself stays a thin wrapper that renders that layout component, same rule as `page.tsx`.
- Route groups (`(group)`), dynamic segments (`[param]`), parallel/intercepting routes, `loading.tsx`, `error.tsx`, `not-found.tsx`, etc. are Next.js routing mechanics only — they decide _which_ module page renders and with what params, never where the module's own code lives.
- Project targets Next.js 16.3.4; App Router file conventions (`page`, `layout`, `template`, `loading`, `error`, `not-found`, `route`, etc.) follow the current Next.js docs — check them (e.g. via context7) if unsure about a specific file convention.

## 7. Additional references

- [references/structure.md](references/structure.md) — full tree with line-by-line comments, only if you need the exact textual detail of a folder.
- `references/template-*.md` — complete, copyable implementation of each layer (see table in section 3). Load them only when you're about to write that layer for the first time; they're not needed to decide where a file goes, only to know what its content looks like.
- [references/typescript-conventions.md](references/typescript-conventions.md) — TypeScript style and typing rules (strict mode, const types pattern, arrow functions, utility types, interface vs type, discriminated unions for coupled props, etc.). Load it whenever you're about to write or review `.ts`/`.tsx` code in any layer; it applies across the board, not just to one folder.

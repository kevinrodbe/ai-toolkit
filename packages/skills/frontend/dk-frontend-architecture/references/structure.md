# Full reference tree

Complete, annotated tree of the target structure for this convention. Consult this file only when you need the exact detail of a specific folder; to decide where a file goes, use the decision tree in [SKILL.md](../SKILL.md).

In a Next.js project, an `app/` folder sits next to (or wraps) `src/`, following Next.js's App Router conventions. It owns routing only — each route's `page.tsx`/`layout.tsx` is a thin wrapper that renders the matching component from `src/modules/<moduleName>/pages/<PageOne>/`. See section 6 of [SKILL.md](../SKILL.md) for the mapping rule. Example:

```text
app (Next.js App Router — routing only, see SKILL.md section 6)
  layout.tsx (renders src/common/layouts/<Layout>)
  page.tsx (renders src/modules/home/pages/HomePage)
  reports
    page.tsx (renders src/modules/reporting/pages/ReportsPage)
    [reportId]
      page.tsx (reads the "reportId" param, passes it as a prop to
                 src/modules/reporting/pages/ReportDetailPage)
```

```text
src
  infra (use as an example what's in ./src/infra)
    http
      fetch.ts (native fetch wrapper with error handling)
      index.ts (fetch adapter using the wrapper to type and build the consuming URL.
                 Exports the adapter instance needed for each domain identified
                 later, e.g. "restGithubApi")
  @types (augmentation types)
    aaaa.d.ts
  common
    context (global context, each hook has its own folder)
      FeedbackContext (e.g. "display modals, alerts, etc" to the user)
        index.ts
        FeedbackContext.ts
        FeedbackContext.types.ts
        FeedbackProvider.tsx
        useFeedbackContext.ts
    hooks (reusable hooks, each hook has its own folder)
      useXxxx
        index.ts
        useXxxx.ts
    layouts (each layout has its own folder, e.g: NoAuth, Dashboard)
      NoAuth
        index.ts
        NoAuth.tsx
        NoAuth.styles.tsx
      Dashboard
        index.ts
        Dashboard.tsx
        Dashboard.styles.tsx
    utils (no business logic)
      <utility file>.ts (e.g: dates.ts, regex.ts, files.ts, number.ts, etc)
  config (configuration required by libraries, e.g: @tanstack/react-query, mui, i18n)
    queryClient.ts (for @tanstack/react-query)
    theme.ts
  modules
    moduleOne (e.g "moduleOne" as: auth, payroll, reporting, sctr, etc)
      context
        <Xxxx>Context
          index.ts
          <Xxxx>Context.ts
          <Xxxx>Context.types.ts
          <Xxxx>Provider.tsx
          use<Xxxx>Context.ts
      store
        index.ts (exports facades for each store)
        <zzzz>.store.ts (zustand store, public API is a facade:
                          custom hook with state selector)
        <mmmm>.store.ts
      services
        <ffff> (grouped by context or domain)
          index.ts
          <ffff>.port.ts (type definitions for the adapter/fetcher, map files)
          <ffff>.map.ts (data transform)
          <ffff>.adapter.ts (function definition with fetch)
          <ffff>.service.ts (hook definition with @tanstack/react-query,
                              consuming the adapters)
      useCases (one custom hook per system use case, named
                use<UseCase>UseCase. Intermediary between components and
                application logic: receives data/events from the component
                and executes the system use case by invoking hooks that call
                backend services, conditionals, actions, consuming from the store)
        useLoginUseCase.ts
        useFetchAllReposUseCase.ts
        useAddReposUseCase.ts
        useFetchSelectedReposUseCase.ts

      pages (components used as pages, can contain their own
             components and contexts. Contain no business or
             system logic; only forward the user's data/events to the
             corresponding "useCase" and execute or display what that
             hook returns)
        PageOne (e.g "PageOne" like "Home", "Reports", "ProductDetail")
          index.ts
          PageOne.tsx
          PageOne.styles.ts (style definitions with pandaCSS)
          PageOne.types.ts (optional if the component is large or has many types)
          _components (used only within this page)
            Compo1 (e.g "Compo1")
              index.ts
              Compo1.tsx
              Compo1.styles.ts (style definitions with pandaCSS)
              Compo1.types.ts (optional if the component is large or has many types)
          context (used only within this page)
            <Yyyy>Context
              index.ts
              <Yyyy>Context.ts
              <Yyyy>Context.types.ts
              <Yyyy>Provider.tsx
              use<Yyyy>Context.ts
```

---
name: react-performance-optimizer
description:
  Optimize React apps for 60fps performance. Implements memoization, code splitting, bundle optimization. Use for Bundle bloat. Activate on "React performance",
  "slow render", "useMemo", "bundle size". NOT for backend optimization, non-React frameworks, or premature optimization.
allowed-tools: Read,Write,Edit,Bash(npm:*)
metadata:
  version: "0.0.1"
---

# React Performance Optimizer

Expert in diagnosing and fixing React performance issues to achieve buttery-smooth 60fps experiences.

## When to Use

✅ **Use for**:

- Slow component re-renders
- Bundle size &gt;500KB (gzipped)
- Time to Interactive &gt;3 seconds
- Memory leaks from unmounted components

❌ **NOT for**:

- Apps with &lt;10 components (premature optimization)
- Backend API slowness (fix the API)
- Network latency (use caching/CDN)
- Non-React frameworks (use framework-specific tools)

## Quick Decision Tree

```
Is your React app slow?
├── Profiler shows &gt;16ms renders? → Use memoization
├── Bundle size &gt;500KB? → Code splitting
├── Lighthouse score &lt;70? → Multiple optimizations
└── Feels fast enough? → Don't optimize yet
```

---

## Technology Selection

### Performance Tools (2024)

| Tool                    | Purpose                     | When to Use             |
| ----------------------- | --------------------------- | ----------------------- |
| React DevTools Profiler | Find slow components        | Always start here       |
| Lighthouse              | Overall performance score   | Before/after comparison |
| webpack-bundle-analyzer | Identify large dependencies | Bundle &gt;500KB        |
| why-did-you-render      | Unnecessary re-renders      | Debug re-render storms  |
| React Compiler (2024+)  | Automatic memoization       | React 19+               |

---

## Common Anti-Patterns

### Anti-Pattern 1: Premature Memoization

**Novice thinking**: "Wrap everything in useMemo for speed"

**Problem**: Adds complexity and overhead for negligible gains.

**Wrong approach**:
Over-optimization

```tsx
function UserCard({ user }) {
  const fullName = useMemo(() => `${user.first} ${user.last}`, [user]);
  const age = useMemo(() => new Date().getFullYear() - user.birthYear, [user]);

  return <div>{fullName}, {age}</div>;
}
```

**Why wrong**: String concatenation is faster than useMemo overhead.

**Correct approach**:
Simple is fast

```tsx
function UserCard({ user }) {
  const fullName = `${user.first} ${user.last}`;
  const age = new Date().getFullYear() - user.birthYear;

  return <div>{fullName}, {age}</div>;
}
```

**Rule of thumb**: Only memoize if:

1. Computation takes &gt;5ms (use Profiler to measure)
2. Result used in dependency array
3. Prevents child re-renders

---

### Anti-Pattern 2: Not Memoizing Callbacks

**Problem**: New function instance on every render breaks React.memo.

**Wrong approach**:

```tsx
// ❌ Child re-renders on every parent render
function Parent() {
  const [count, setCount] = useState(0);

  return (
    <Child onUpdate={() => setCount(count + 1)} />
  );
}

const Child = React.memo(({ onUpdate }) => {
  return <button onClick={onUpdate}>Update</button>;
});
```

**Why wrong**: Arrow function creates new reference → React.memo useless.

**Correct approach**:

```tsx
// ✅ Stable callback reference
function Parent() {
  const [count, setCount] = useState(0);

  const handleUpdate = useCallback(() => {
    setCount(c => c + 1);  // Updater function avoids dependency
  }, []);

  return <Child onUpdate={handleUpdate} />;
}

const Child = React.memo(({ onUpdate }) => {
  return <button onClick={onUpdate}>Update</button>;
});
```

---

### Anti-Pattern 3: No Code Splitting

**Problem**: 2MB bundle downloaded upfront, slow initial load.

**Wrong approach**:
Everything in main bundle

```tsx
import AdminPanel from './AdminPanel';
import Dashboard from './Dashboard';
import Settings from './Settings';

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}
```

**Correct approach**:
Lazy load routes

```tsx
import { lazy, Suspense } from 'react';

const AdminPanel = lazy(() => import('./AdminPanel'));
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

**Impact**: Initial bundle: 2MB → 300KB.

---

### Anti-Pattern 4: Expensive Operations in Render

**Problem**: Heavy computation on every render.

**Wrong approach**:

```tsx
// ❌ Sorts on every render (even when data unchanged)
function ProductList({ products }) {
  const sorted = products.sort((a, b) => b.price - a.price);

  return <div>{sorted.map(p => <Product product={p} />)}</div>;
}
```

**Correct approach**:
Memoize expensive operation

```tsx
function ProductList({ products }) {
  const sorted = useMemo(
    () => [...products].sort((a, b) => b.price - a.price),
    [products]
  );

  return <div>{sorted.map(p => <Product product={p} />)}</div>;
}
```
---

### Anti-Pattern 5: Context Over-rendering

#### 5.1. Context value changes on every render → all consumers re-render.
**Problem** Every time the Provider's parent re-renders, a new object reference is created. Every consumer of that context re-renders, even if the data inside has not changed.

**Wrong approach**:

```tsx
<AuthContext.Provider value={{ user, logout }}>
```

**Correct approach**:

```tsx
const value = useMemo(() => ({ user, logout }), [user, logout]);
<AuthContext.Provider value={value}>
```

#### 5.2. Context state and actions in same context → all consumers re-render on state change.
**Problem**: Mixing frequently changing state (e.g. count) with stable actions (e.g. increment) causes all consumers to re-render on every state change.

**Wrong approach**:

```tsx
const value = useMemo(() => ({ count, increment }), [count, increment]);

<CounterContext.Provider value={value}>
```
**Correct approach**:
Split into separate contexts

```tsx
const countState = useMemo(() => ({ count }), [count]);
const countActions = useMemo(() => ({ increment }), [increment]);

<CountContext.Provider value={countState}>
  <ActionsContext.Provider value={countActions}>
    {children}
  </ActionsContext.Provider>
</CountContext.Provider>
```

---

### 6. Anti-Pattern 6: Oversized components (split candidates)

**Signal:** Component files > 250 lines or JSX trees with > 4 levels of nesting.

**Why it hurts:** Large components re-render their entire subtree. Splitting allows React to
isolate updates to the subtree that actually changed.

**Pattern to apply:**

- Extract independent sections into named sub-components
- Move sub-components to their own files if reused or complex
- Isolate state: keep state as close to where it's used as possible (state colocation)

**Wrong approach**:
```tsx
// ❌ Monolithic
const Dashboard = () => (
  <div>{/* 200 lines of header, sidebar, table, filters */}</div>
);
```

**Correct approach**:
Split and isolate

```tsx
const Dashboard = () => (
  <div>
    <DashboardHeader />
    <DashboardSidebar />
    <DashboardTable />
  </div>
);
```
---

## Production Checklist

```
□ Routes code-split with React.lazy
□ Heavy components lazy-loaded
□ Callbacks memoized with useCallback
□ Expensive computations use useMemo
□ Pure components wrapped in React.memo
□ Bundle analyzed (no duplicate dependencies)
□ Tree-shaking enabled (ESM imports)
□ Images optimized and lazy-loaded
□ Lighthouse score &gt;90
□ Time to Interactive &lt;3 seconds
```

---

## When to Use vs Avoid

| Scenario                               | Optimize?                      |
| -------------------------------------- | ------------------------------ |
| Rendering 1000+ list items             | ✅ Yes - virtualize            |
| Sorting/filtering large arrays         | ✅ Yes - useMemo               |
| Passing callbacks to memoized children | ✅ Yes - useCallback           |
| String concatenation                   | ❌ No - fast enough            |
| Simple arithmetic                      | ❌ No - don't memoize          |
| 10-item list                           | ❌ No - premature optimization |

---

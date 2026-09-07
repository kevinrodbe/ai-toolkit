# Template: `store/<name>.store.ts`

Zustand with facade. The raw store (`create(...)`) **is not exported**. Only custom hooks (facades) with a selector are exported, so consumers can't do an arbitrary `setState` or over-render. See the layer's responsibility in [SKILL.md](../SKILL.md).

```ts
// todos.store.ts
import { create } from "zustand";
import type { Todo } from "../services/todos";

interface TodosState {
  selectedTodoId: number | null;
  setSelectedTodoId: (id: number | null) => void;
}

const useTodosStore = create<TodosState>((set) => ({
  selectedTodoId: null,
  setSelectedTodoId: (id) => set({ selectedTodoId: id }),
}));

// Facade: the only public way to read/write this state slice.
export const useSelectedTodoId = () =>
  useTodosStore((state) => state.selectedTodoId);
export const useSetSelectedTodoId = () =>
  useTodosStore((state) => state.setSelectedTodoId);
```

```ts
// store/index.ts
export * from "./todos.store";
```

---
name: dk-ts
description: >
  TypeScript strict patterns and best practices.
  Trigger: When writing TypeScript code - types, interfaces, generics.
license: Apache-2.0
metadata:
  author: RodBe
  version: '2.0.0'
---

## Constraints

### MUST DO

- Enable strict mode with all compiler flags
- Use type-first API design
- Implement branded types for domain modeling
- Use `satisfies` operator for type validation
- Create discriminated unions for state machines
- Use `Annotated` pattern with type predicates
- Generate declaration files for libraries
- Optimize for type inference
- Use arrow functions (`const fn = () => {}`) for all function declarations
- Use built-in utility types (`Pick`, `Omit`, `Partial`, etc.) to derive types from existing ones — never recreate a type manually
- Always use curly braces `{}` to delimit all statement blocks (`if`, `else`, `for`, `while`, etc.)

### MUST NOT DO

- Use explicit `any` without justification
- Skip type coverage for public APIs
- Mix type-only and value imports
- Disable strict null checks
- Use `as` assertions without necessity
- Ignore compiler performance warnings
- Skip declaration file generation
- Use enums (prefer const objects with `as const`)
- Use `function` keyword declarations (use arrow functions instead)
- Recreate types that can be derived from existing ones with utility types
- Omit curly braces on single-line `if`, `else`, `for`, or `while` bodies

## Const Types Pattern (REQUIRED)

```typescript
// ✅ ALWAYS: Create const object first, then extract type
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

// ❌ NEVER: Direct union types
type Status = 'active' | 'inactive' | 'pending';
```

**Why?** Single source of truth, runtime values, autocomplete, easier refactoring.

## Flat Interfaces (REQUIRED)

```typescript
// ✅ ALWAYS: One level depth, nested objects → dedicated interface
interface UserAddress {
  street: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  address: UserAddress; // Reference, not inline
}

interface Admin extends User {
  permissions: string[];
}

// ❌ NEVER: Inline nested objects
interface User {
  address: { street: string; city: string }; // NO!
}
```

## Never Use `any`

```typescript
// ✅ Use unknown for truly unknown types
const parse = (input: unknown): User => {
  if (isUser(input)) {
    return input;
  }
  throw new Error('Invalid input');
};

// ✅ Use generics for flexible types
const first = <T>(arr: T[]): T | undefined => {
  return arr[0];
};

// ❌ NEVER
const parse = (input: any): any => {};
```

## Arrow Functions (REQUIRED)

Always use arrow functions. Never use the `function` keyword for declarations or expressions.

```typescript
// ✅ ALWAYS: Arrow functions
const greet = (name: string): string => `Hello, ${name}`;

const fetchUser = async (id: string): Promise<User> => {
  const data = await api.get(id);

  return data;
};

const double = <T extends number>(x: T): T => (x * 2) as T;

// ❌ NEVER: function keyword
function greet(name: string): string {
  return `Hello, ${name}`;
}

async function fetchUser(id: string): Promise<User> {
  const data = await api.get(id);
  return data;
}
```

**Why?** Consistent style, lexical `this` binding, and no hoisting surprises.

## Always Use Curly Braces (REQUIRED)

Every statement block — `if`, `else`, `for`, `while` — must be wrapped in curly braces, even when the body is a single line.

```typescript
// ✅ ALWAYS: Curly braces on every block
const parse = (input: unknown): User => {
  if (isUser(input)) {
    return input;
  }

  throw new Error('Invalid input');
};

for (const item of items) {
  process(item);
}

if (isAdmin) {
  allowAccess();
} else {
  denyAccess();
}

// ❌ NEVER: Braceless single-line bodies
if (isUser(input)) {
  return input;
}

for (const item of items) {
  process(item);
}

if (isAdmin) {
  allowAccess();
} else {
  denyAccess();
}
```

**Why?** Braceless bodies are a common source of bugs when adding a second statement — the indentation looks correct but only the first line is inside the block. Consistent braces also make diffs cleaner and intent unambiguous.

## Utility Types (REQUIRED)

**Always derive types from existing ones using built-in utility types — never recreate them manually.** One interface is the single source of truth; all related shapes are derived from it. When the source changes, derived types update automatically.

```typescript
Pick<User, 'id' | 'name'>; // Select fields
Omit<User, 'id'>; // Exclude fields
Partial<User>; // All optional
Required<User>; // All required
Readonly<User>; // All readonly
Record<string, User>; // Object type
Extract<Union, 'a' | 'b'>; // Extract from union
Exclude<Union, 'a'>; // Exclude from union
NonNullable<T | null>; // Remove null/undefined
ReturnType<typeof fn>; // Function return type
Parameters<typeof fn>; // Function params tuple
```

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// ✅ ALWAYS: Derive — single source of truth
type PublicUser = Omit<User, 'password'>;
type UserPreview = Pick<User, 'id' | 'name'>;
type UpdateUserDto = Partial<Omit<User, 'id'>>;

// ❌ NEVER: Recreate manually — duplicates diverge silently
interface PublicUser {
  id: string;
  name: string;
  email: string; // "password" forgotten? or intentional? unclear
}
```

## Interface vs Type (REQUIRED)

```typescript
// ✅ ALWAYS: Use interface for object shapes and variable typings
interface User {
  id: string;
  name: string;
}

interface ApiResponse {
  data: User[];
  total: number;
}

// ✅ ONLY use type when interface cannot do the job:
// - Union/intersection types
type ID = string | number;
type AdminOrUser = Admin | User;

// - Mapped types
type ReadonlyUser = { readonly [K in keyof User]: User[K] };

// - Conditional types
type IsString<T> = T extends string ? true : false;

// - Const object type extraction (see Const Types Pattern)
type Status = (typeof STATUS)[keyof typeof STATUS];

// - Tuple types
type Pair = [string, number];

// ❌ NEVER: Use type for plain object shapes when interface works
type User = {
  // NO — use interface instead
  id: string;
  name: string;
};
```

**Why?** Interfaces are extendable (`extends`), give better error messages, support declaration merging, and signal clearly that the shape describes an object. Reserve `type` for operations that interfaces cannot express.

## Type Guards

```typescript
const isUser = (value: unknown): value is User => {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value;
};
```

## Coupled Optional Props (REQUIRED)

Do not model semantically coupled props as independent optionals — this allows invalid half-states that compile but break at runtime. Use discriminated unions with `never` to make invalid combinations impossible.

```typescript
// ❌ BEFORE: Independent optionals — half-states allowed
interface PaginationProps {
  onPageChange?: (page: number) => void;
  pageSize?: number;
  currentPage?: number;
}

// ✅ AFTER: Discriminated union — shape is all-or-nothing
type ControlledPagination = {
  controlled: true;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

type UncontrolledPagination = {
  controlled: false;
  currentPage?: never;
  pageSize?: never;
  onPageChange?: never;
};

type PaginationProps = ControlledPagination | UncontrolledPagination;
```

**Key rule:** If two or more props are only meaningful together, they belong to the same discriminated union branch. Mixing them as independent optionals shifts correctness responsibility from the type system to runtime guards.

## Import Types

```typescript
import type { User } from './types';
import { createUser, type Config } from './utils';
```

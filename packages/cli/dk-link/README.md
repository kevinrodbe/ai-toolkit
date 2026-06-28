# @kevinrodbe/dk-link

CLI to install and link AI agents and skills to local AI platforms (Claude, GitHub Copilot, OpenCode).

## Installation

```bash
npm install -g @kevinrodbe/dk-link
# or
pnpm add -g @kevinrodbe/dk-link
```

## Usage

Run without arguments to launch the interactive mode:

```bash
dk-link
```

### Commands

#### `link`

Links agents and skills already installed in `node_modules` to the selected AI platforms by creating symlinks in the appropriate directories.

```bash
dk-link link [options]
```

**Options**

| Option              | Alias | Description                                          |
| ------------------- | ----- | ---------------------------------------------------- |
| `--platforms <ids>` | `-p`  | Comma-separated platform IDs to link to              |
| `--all`             | `-a`  | Link all discovered agents and skills                |
| `--agents <names>`  |       | Comma-separated agent package or short names to link |
| `--skills <names>`  |       | Comma-separated skill package or short names to link |

**Available platform IDs**

| ID               | Platform                    |
| ---------------- | --------------------------- |
| `claude`         | Claude (`.claude/`)         |
| `copilot` | GitHub Copilot (`.github/`) |
| `opencode`       | OpenCode (`.opencode/`)     |

**Examples**

Link everything to all three platforms without any prompts:

```bash
dk-link link --platforms claude,copilot,opencode --all
```

Link only specific agents and skills:

```bash
dk-link link --platforms claude --agents my-agent --skills my-skill,another-skill
```

Link all packages to a single platform:

```bash
dk-link link --platforms opencode --all
```

Run in fully interactive mode:

```bash
dk-link link
```

---

#### `add`

Browses the available packages in the registry, installs the selected ones, and then links them — all in one step.

```bash
dk-link add
```

This command always runs interactively.

## How linking works

- **Skills** are symlinked into `<platform-dir>/skills/<short-name>/`
- **Agents** are symlinked into `<platform-dir>/agents/<short-name>.md`

Packages must follow the naming convention `@kevinrodbe/agent-*` or `@kevinrodbe/skill-*` and be present in `node_modules` to be detected.

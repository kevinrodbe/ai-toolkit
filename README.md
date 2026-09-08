# ai-toolkit

Skills and Agents monorepo.

## Linking skills

Skills live under `packages/skills/**/**` (each skill is a folder containing a `SKILL.md`). Use
`scripts/link-skills.js` to symlink them into `~/.claude/skills/` and/or `~/.agents/skills/` so
they're picked up by Claude or other agents.

### Usage

```bash
node scripts/link-skills.js [--target=claude|agents|both] [--action=link|unlink] [--all]
```

- `--target` — where to link/unlink: `claude` (`~/.claude/skills`), `agents` (`~/.agents/skills`),
  or `both`. If omitted, you're prompted to choose.
- `--action` — `link` (default) or `unlink`.
- `--all` — apply to every skill without prompting. **Only allowed with `--action=unlink`** —
  linking always requires picking skills explicitly, so a single command can't accidentally link
  everything.

### Examples

**Fully interactive — choose target and skills**

```bash
node scripts/link-skills.js
# or
pnpm link:skills
```

Prompts for the target(s) first, then which skills to link.

**Fixed target, skills chosen interactively**

```bash
node scripts/link-skills.js --target=claude
node scripts/link-skills.js --target=agents
node scripts/link-skills.js --target=both
```

**Unlink interactively (choose target and skills to remove)**

```bash
node scripts/link-skills.js --action=unlink
# or
pnpm link:skills:unlink
```

**Unlink with a fixed target, skills chosen interactively**

```bash
node scripts/link-skills.js --target=claude --action=unlink
node scripts/link-skills.js --target=agents --action=unlink
node scripts/link-skills.js --target=both --action=unlink
```

**Unlink every skill, target chosen interactively**

```bash
node scripts/link-skills.js --action=unlink --all
```

**Unlink every skill, fully non-interactive (CI-friendly)**

```bash
node scripts/link-skills.js --target=claude --action=unlink --all
node scripts/link-skills.js --target=agents --action=unlink --all
node scripts/link-skills.js --target=both --action=unlink --all
```

**Invalid combinations (the script exits with an error)**

```bash
node scripts/link-skills.js --action=link --all     # --all only works with unlink
node scripts/link-skills.js --action=publish         # unknown action
node scripts/link-skills.js --target=windows         # unknown target
```

> Note: there's no non-interactive way to `link` — you always pick which skills to link from the
> prompt, by design, to avoid linking everything in one shot.

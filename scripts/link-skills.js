import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import * as p from '@clack/prompts';
import { parseArgs } from './utils.js';

const rootDir = resolve(import.meta.dirname, '..');
const skillsDir = join(rootDir, 'packages', 'skills');

const TARGETS = {
  claude: join(homedir(), '.claude', 'skills'),
  agents: join(homedir(), '.agents', 'skills'),
};

/** @param {string} dir @param {string[]} acc */
function findSkills(dir, acc) {
  if (!existsSync(dir)) {
    return acc;
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const entryPath = join(dir, entry.name);
    if (existsSync(join(entryPath, 'SKILL.md'))) {
      acc.push(entryPath);
    } else {
      findSkills(entryPath, acc);
    }
  }
  return acc;
}

/** @param {string} linkPath */
function removeExistingLink(linkPath) {
  if (!existsSync(linkPath) && !isSymlink(linkPath)) {
    return false;
  }
  rmSync(linkPath, { force: true });
  return true;
}

/** @param {string} path */
function isSymlink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

const { target, action = 'link' } = parseArgs(process.argv, ['--target', '--action']);
const selectAll = process.argv.includes('--all');

if (!['link', 'unlink'].includes(action)) {
  console.error(`Unknown --action "${action}". Use link | unlink.`);
  process.exit(1);
}
if (target !== undefined && !['claude', 'agents', 'both'].includes(target)) {
  console.error(`Unknown --target "${target}". Use claude | agents | both.`);
  process.exit(1);
}
if (selectAll && action !== 'unlink') {
  console.error('--all is only supported with --action=unlink.');
  process.exit(1);
}

const skillPaths = findSkills(skillsDir, []);

if (skillPaths.length === 0) {
  console.log('No skills found under packages/skills/**/**.');
  process.exit(0);
}

/** @param {string} skillPath @param {string[]} targetDirs */
function isLinkedEverywhere(skillPath, targetDirs) {
  const skillName = skillPath.split('/').pop();
  return targetDirs.every((targetDir) => {
    const linkPath = join(targetDir, skillName);
    return isSymlink(linkPath) && readlinkSync(linkPath) === skillPath;
  });
}

async function pickTargetDirs() {
  if (target !== undefined) {
    return target === 'both' ? Object.values(TARGETS) : [TARGETS[target]];
  }

  const selected = await p.multiselect({
    message: `Select where to ${action} skills:`,
    options: [
      { value: TARGETS.claude, label: '.claude/skills' },
      { value: TARGETS.agents, label: '.agents/skills' },
    ],
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return selected;
}

/** @param {string[]} targetDirs */
async function pickSkillPaths(targetDirs) {
  if (selectAll) {
    return skillPaths;
  }

  const selected = await p.multiselect({
    message: `Select the skills to ${action} in ${targetDirs.join(', ')}:`,
    options: skillPaths.map((skillPath) => ({
      value: skillPath,
      label: skillPath.split('/').pop(),
      hint: isLinkedEverywhere(skillPath, targetDirs) ? 'linked' : undefined,
    })),
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }

  return selected;
}

const isInteractive = target === undefined || !selectAll;

if (isInteractive) {
  p.intro('Link agent skills');
}

const targetDirs = await pickTargetDirs();
const selectedSkillPaths = await pickSkillPaths(targetDirs);

for (const targetDir of targetDirs) {
  mkdirSync(targetDir, { recursive: true });

  for (const skillPath of selectedSkillPaths) {
    const skillName = skillPath.split('/').pop();
    const linkPath = join(targetDir, skillName);
    const shouldRemove = action === 'unlink' || existsSync(linkPath) || isSymlink(linkPath);

    if (shouldRemove) {
      const removed = removeExistingLink(linkPath);
      if (removed) {
        console.log(`Removed: ${linkPath}`);
      }
    }

    if (action === 'unlink') {
      continue;
    }

    symlinkSync(skillPath, linkPath, 'dir');
    console.log(`Linked:  ${linkPath} -> ${skillPath}`);
  }
}

if (isInteractive) {
  p.outro('Done.');
}

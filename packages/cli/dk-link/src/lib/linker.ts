import { existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import chalk from 'chalk';

import type { AgentPackage, SkillPackage } from '@/lib/scanner';
import type { AgentPlatform } from '@/lib/platforms';

const ensureDir = (dir: string): void => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

const findFirstMdFile = (dir: string): string | undefined =>
  readdirSync(dir).find((f) => f.endsWith('.md'));

const upsertSymlink = (target: string, linkPath: string): void => {
  try {
    lstatSync(linkPath);
    unlinkSync(linkPath);
  } catch {
    // link doesn't exist yet
  }
  const relTarget = relative(dirname(linkPath), target);

  symlinkSync(relTarget, linkPath);
};

export const linkSkills = ({
  cwd,
  skills,
  platforms,
}: {
  cwd: string;
  platforms: Array<AgentPlatform>;
  skills: Array<SkillPackage>;
}): void => {
  for (const skill of skills) {
    console.log(chalk.bold(`\n  ${skill.packageName}`));

    const linkPaths = [
      ...new Set(platforms.map((p) => join(cwd, p.skillsDir, 'skills', skill.shortName))),
    ];

    for (const linkPath of linkPaths) {
      ensureDir(dirname(linkPath));
      upsertSymlink(skill.srcDir, linkPath);
      const rel = relative(cwd, linkPath);

      console.log(chalk.green(`    ✓ ${rel}/`));
    }
  }
};

export const linkAgents = ({
  cwd,
  agents,
  platforms,
}: {
  agents: Array<AgentPackage>;
  cwd: string;
  platforms: Array<AgentPlatform>;
}): void => {
  for (const agent of agents) {
    console.log(chalk.bold(`\n  ${agent.packageName}`));

    const mdFile = findFirstMdFile(agent.srcDir);

    if (!mdFile) {
      console.log(chalk.yellow(`    ⚠ No .md file found in ${agent.srcDir}, skipping.`));
      continue;
    }

    const mdTarget = join(agent.srcDir, mdFile);
    const linkPaths = [
      ...new Set(platforms.map((p) => join(cwd, p.agentsDir, 'agents', `${agent.shortName}.md`))),
    ];

    for (const linkPath of linkPaths) {
      ensureDir(dirname(linkPath));
      upsertSymlink(mdTarget, linkPath);
      const rel = relative(cwd, linkPath);

      console.log(chalk.green(`    ✓ ${rel}`));
    }
  }
};

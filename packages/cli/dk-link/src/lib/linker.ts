import { existsSync, lstatSync, readdirSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import chalk from 'chalk';

import type { AgentPackage, SkillPackage } from '@/lib/scanner.js';
import type { AgentPlatform } from '@/lib/platforms.js';

const ensureDir = (dir: string): void => {
	if (!existsSync(dir)) {
		readdirSync(dir, { recursive: true });
	}
};

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
	skills: SkillPackage[];
	platforms: AgentPlatform[];
}): void => {
	for (const skill of skills) {
		console.log(chalk.bold(`\n  ${skill.packageName}`));

		const destinations: string[] = platforms.map(p => join(cwd, p.skillsDir, 'skills'));

		for (const dest of destinations) {
			ensureDir(dest);
			const linkPath = join(dest, skill.shortName);
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
	cwd: string;
	agents: AgentPackage[];
	platforms: AgentPlatform[];
}): void => {
	for (const agent of agents) {
		console.log(chalk.bold(`\n  ${agent.packageName}`));

		const destinations = platforms.map(p => join(cwd, p.agentsDir, 'agents'));

		for (const dest of destinations) {
			ensureDir(dest);
			const linkPath = join(dest, agent.shortName);
			upsertSymlink(agent.srcDir, linkPath);
			const rel = relative(cwd, linkPath);
			console.log(chalk.green(`    ✓ ${rel}`));
		}
	}
};

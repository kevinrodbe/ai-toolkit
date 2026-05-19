import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';

import type { AgentPackage, SkillPackage } from '@/lib/scanner.js';
import type { AgentPlatform } from '@/lib/platforms.js';

function ensureDir(dir: string): void {
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function upsertSymlink(target: string, linkPath: string): void {
	try {
		fs.lstatSync(linkPath);
		fs.unlinkSync(linkPath);
	} catch {
		// link doesn't exist yet
	}
	const relTarget = path.relative(path.dirname(linkPath), target);
	fs.symlinkSync(relTarget, linkPath);
}

export function linkSkills(cwd: string, skills: SkillPackage[], platforms: AgentPlatform[]): void {
	for (const skill of skills) {
		console.log(chalk.bold(`\n  ${skill.packageName}`));

		const destinations: string[] = [
			path.join(cwd, '.agents', 'skills'),
			...platforms.map(p => path.join(cwd, p.skillsDir, 'skills')),
		];

		for (const dest of destinations) {
			ensureDir(dest);
			const linkPath = path.join(dest, skill.shortName);
			upsertSymlink(skill.srcDir, linkPath);
			const rel = path.relative(cwd, linkPath);
			console.log(chalk.green(`    ✓ ${rel}/`));
		}
	}
}

export function linkAgents(cwd: string, agents: AgentPackage[]): void {
	const destinations = [path.join(cwd, '.claude', 'agents'), path.join(cwd, '.github', 'agents')];

	for (const agent of agents) {
		console.log(chalk.bold(`\n  ${agent.packageName}`));
		for (const file of agent.files) {
			for (const destDir of destinations) {
				ensureDir(destDir);
				const linkPath = path.join(destDir, file.fileName);
				upsertSymlink(file.filePath, linkPath);
				const rel = path.relative(cwd, linkPath);
				console.log(chalk.green(`    ✓ ${rel}`));
			}
		}
	}
}

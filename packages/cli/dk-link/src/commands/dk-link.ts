#!/usr/bin/env node

import process from 'node:process';

import { checkbox } from '@inquirer/prompts';
import chalk from 'chalk';

import { linkAgents, linkSkills } from '@/lib/linker.js';
import { AGENT_PLATFORMS } from '@/lib/platforms.js';
import { scanNodeModules } from '@/lib/scanner.js';
import { initEvents } from '@/events/index.js';

initEvents();

const cwd = process.cwd();

async function run(): Promise<void> {
	const { agents, skills } = scanNodeModules(cwd);

	// ── Skills ────────────────────────────────────────────────────────────
	if (skills.length === 0) {
		console.log(chalk.yellow('No skills (@kevinrodbe/skill-*) found in node_modules.'));
	} else {
		const selectedSkills = await checkbox({
			choices: skills.map(s => ({
				name: s.packageName,
				value: s,
			})),
			message: 'Select skills to install:',
		});

		if (selectedSkills.length > 0) {
			const selectedPlatforms = await checkbox({
				choices: AGENT_PLATFORMS.map(p => ({
					name: p.label,
					value: p,
				})),
				message: '¿En qué agentes desea instalarlo?',
			});

			console.log(chalk.bold('\nLinking skills...'));
			linkSkills(cwd, selectedSkills, selectedPlatforms);
		}
	}

	// ── Agents ────────────────────────────────────────────────────────────
	if (agents.length > 0) {
		console.log(chalk.bold('\nLinking agents...'));
		linkAgents(cwd, agents);
	}

	console.log(chalk.bold.green('\nDone!'));
}

await run();

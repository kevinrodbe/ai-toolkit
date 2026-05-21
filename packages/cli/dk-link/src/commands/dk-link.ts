#!/usr/bin/env node

import process from 'node:process';

import { checkbox } from '@inquirer/prompts';
import chalk from 'chalk';

import { linkAgents, linkSkills } from '@/lib/linker.js';
import { AGENT_PLATFORMS } from '@/lib/platforms.js';
import { SCOPE, scanNodeModules } from '@/lib/scanner.js';
import { initEvents } from '@/events/index.js';

initEvents();

const cwd = process.cwd();

const run = async (): Promise<void> => {
	const { agents, skills } = scanNodeModules(cwd);

	if (agents.length === 0 && skills.length === 0) {
		console.log(chalk.yellow(`No agents (${SCOPE}/agent-*) or skills (${SCOPE}/skill-*) found in node_modules.`));

		return;
	}

	const selectedPlatforms = await checkbox({
		choices: AGENT_PLATFORMS.map(p => ({
			name: p.label,
			value: p,
		})),
		message: '¿En qué agentes deseas instalarlos?',
	});

	if (!agents.length) {
		console.log(chalk.yellow(`No agents (${SCOPE}/agent-*) found in node_modules.`));
	} else {
		const selectedAgents = await checkbox({
			choices: agents.map(a => ({
				name: a.packageName,
				value: a,
			})),
			message: 'Select agents to install:',
		});

		if (selectedAgents.length) {
			console.log(chalk.bold('\nLinking agents...'));
			linkAgents({ agents: selectedAgents, cwd, platforms: selectedPlatforms });
		}
	}

	if (!skills.length) {
		console.log(chalk.yellow(`No skills (${SCOPE}/skill-*) found in node_modules.`));
	} else {
		const selectedSkills = await checkbox({
			choices: skills.map(s => ({
				name: s.packageName,
				value: s,
			})),
			message: 'Select skills to install:',
		});

		if (selectedSkills.length) {
			console.log(chalk.bold('\nLinking skills...'));
			linkSkills({ cwd, platforms: selectedPlatforms, skills: selectedSkills });
		}
	}

	console.log(chalk.bold.green('\nDone!'));
};

await run();

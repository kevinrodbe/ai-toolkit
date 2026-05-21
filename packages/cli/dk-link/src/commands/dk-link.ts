#!/usr/bin/env node

import { execSync } from 'node:child_process';
import process from 'node:process';

import { checkbox, select } from '@inquirer/prompts';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { initEvents } from '@/events/index.js';
import { linkAgents, linkSkills } from '@/lib/linker.js';
import { detectPackageManager, getInstallCommand } from '@/lib/package-manager.js';
import { AGENT_PLATFORMS } from '@/lib/platforms.js';
import { resolvePackages } from '@/lib/packages.js';
import { SCOPE, scanNodeModules } from '@/lib/scanner.js';

initEvents();

const cwd = process.cwd();

// ── Commands ───────────────────────────────────────────────────────────────

const runLink = async (): Promise<void> => {
	const { agents, skills } = scanNodeModules(cwd);

	if (agents.length === 0 && skills.length === 0) {
		console.log(chalk.yellow(`No agents (${SCOPE}/agent-*) or skills (${SCOPE}/skill-*) found in node_modules.`));
		return;
	}

	const selectedPlatforms = await checkbox({
		choices: AGENT_PLATFORMS.map(p => ({ name: p.label, value: p })),
		message: '¿En qué agentes deseas instalarlos?',
	});

	if (!agents.length) {
		console.log('  ' + chalk.yellow(`No agents (${SCOPE}/agent-*) found in node_modules.`));
	} else {
		const selectedAgents = await checkbox({
			choices: agents.map(a => ({ name: a.packageName, value: a })),
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
		console.log('\n\n');
		const selectedSkills = await checkbox({
			choices: skills.map(s => ({ name: s.packageName, value: s })),
			message: 'Select skills to install:',
		});

		if (selectedSkills.length) {
			console.log(chalk.bold('\nLinking skills...'));
			linkSkills({ cwd, platforms: selectedPlatforms, skills: selectedSkills });
		}
	}

	console.log(chalk.bold.green('\nDone!'));
};

const runAdd = async (): Promise<void> => {
	const pm = detectPackageManager(cwd);
	console.log(chalk.dim(`  Package manager detected: ${chalk.cyan(pm)}\n`));

	const selectedPackages = await checkbox({
		choices: resolvePackages().map(p => ({
			name: `${p.packageName}  ${chalk.dim(`(${p.type})`)}`,
			value: p,
		})),
		message: 'Select packages to install:',
	});

	if (!selectedPackages.length) {
		console.log(chalk.yellow('\nNo packages selected.'));
		return;
	}

	const packageNames = selectedPackages.map(p => p.packageName);
	const command = getInstallCommand(pm, packageNames);

	console.log(chalk.bold('\nInstalling packages...'));
	console.log(chalk.dim(`  $ ${command}\n`));

	try {
		execSync(command, { cwd, stdio: 'inherit' });
		console.log(chalk.bold.green('\nDone! Run `dk-link link` to link them.'));
	} catch {
		console.error(chalk.red('\nInstallation failed. Please check the output above.'));
		process.exit(1);
	}
};

// ── CLI definition ─────────────────────────────────────────────────────────

const args = hideBin(process.argv);

if (args.length === 0) {
	const command = await select({
		choices: [
			{ description: 'Browse and install available agents and skills', name: 'add', value: 'add' as const },
			{ description: 'Link installed agents and skills to AI platforms', name: 'link', value: 'link' as const },
		],
		message: 'What do you want to do?',
	});

	if (command === 'add') {
		await runAdd();
	} else {
		await runLink();
	}
} else {
	await yargs(args)
		.scriptName('dk-link')
		.usage('$0 <command>')
		.command('link', 'Link installed agents and skills to AI platforms', {}, runLink)
		.command('add', 'Browse and install available agents and skills', {}, runAdd)
		.strict()
		.help()
		.alias('h', 'help')
		.parse();
}

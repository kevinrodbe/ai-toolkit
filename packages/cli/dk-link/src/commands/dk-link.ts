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
import { AGENT_PLATFORMS, type AgentPlatform } from '@/lib/platforms.js';
import { resolvePackages } from '@/lib/packages.js';
import { type AgentPackage, SCOPE, type SkillPackage, scanNodeModules } from '@/lib/scanner.js';

initEvents();

const cwd = process.cwd();

interface LinkArgv {
  agents?: string;
  all?: boolean;
  platforms?: string;
  skills?: string;
}

const resolvePlatforms = async (platformArg?: string): Promise<Array<AgentPlatform>> => {
  if (platformArg) {
    const ids = platformArg.split(',').map((s) => s.trim());
    const selected = AGENT_PLATFORMS.filter((p) => ids.includes(p.id));

    if (!selected.length) {
      console.error(
        chalk.red(`\nNo valid platforms. Valid IDs: ${AGENT_PLATFORMS.map((p) => p.id).join(', ')}`)
      );
      process.exit(1);
    }

    return selected;
  }

  return checkbox({
    choices: AGENT_PLATFORMS.map((p) => ({ name: p.label, value: p })),
    message: '¿En qué plataformas deseas linkearlo?',
  });
};

const linkPackages = async ({
  agents,
  platformArg,
  skills,
}: {
  agents: Array<AgentPackage>;
  platformArg?: string;
  skills: Array<SkillPackage>;
}): Promise<void> => {
  const selectedPlatforms = await resolvePlatforms(platformArg);

  if (agents.length) {
    console.log(chalk.bold('\nLinking agents...'));
    linkAgents({ agents, cwd, platforms: selectedPlatforms });
  }

  if (skills.length) {
    console.log(chalk.bold('\nLinking skills...'));
    linkSkills({ cwd, platforms: selectedPlatforms, skills });
  }

  console.log(chalk.bold.green('\nDone!'));
};

const runLink = async (argv: LinkArgv = {}): Promise<void> => {
  const { agents, skills } = scanNodeModules(cwd);

  if (agents.length === 0 && skills.length === 0) {
    console.log(
      chalk.yellow(
        `No agents (${SCOPE}/agent-*) or skills (${SCOPE}/skill-*) found in node_modules.`
      )
    );

    return;
  }

  let selectedAgents: Array<AgentPackage> = [];
  let selectedSkills: Array<SkillPackage> = [];

  const isInteractive = !argv.all && !argv.agents && !argv.skills;

  if (isInteractive) {
    if (agents.length) {
      selectedAgents = await checkbox({
        choices: agents.map((a) => ({ name: a.packageName, value: a })),
        message: 'Select agents to link:',
      });
    } else {
      console.log('  ' + chalk.yellow(`No agents (${SCOPE}/agent-*) found in node_modules.`));
    }

    if (skills.length) {
      console.log('\n\n');
      selectedSkills = await checkbox({
        choices: skills.map((s) => ({ name: s.packageName, value: s })),
        message: 'Select skills to link:',
      });
    } else {
      console.log(chalk.yellow(`No skills (${SCOPE}/skill-*) found in node_modules.`));
    }
  } else {
    if (!agents.length) {
      console.log('  ' + chalk.yellow(`No agents (${SCOPE}/agent-*) found in node_modules.`));
    } else if (argv.all) {
      selectedAgents = agents;
    } else if (argv.agents) {
      const names = argv.agents.split(',').map((s) => s.trim());

      selectedAgents = agents.filter(
        (a) =>
          names.includes(a.name) || names.includes(a.shortName) || names.includes(a.packageName)
      );
    }

    if (!skills.length) {
      console.log(chalk.yellow(`No skills (${SCOPE}/skill-*) found in node_modules.`));
    } else if (argv.all) {
      selectedSkills = skills;
    } else if (argv.skills) {
      const names = argv.skills.split(',').map((s) => s.trim());

      selectedSkills = skills.filter(
        (s) =>
          names.includes(s.name) || names.includes(s.shortName) || names.includes(s.packageName)
      );
    }
  }

  await linkPackages({
    agents: selectedAgents,
    platformArg: argv.platforms,
    skills: selectedSkills,
  });
};

const runAdd = async (): Promise<void> => {
  const pm = detectPackageManager(cwd);

  console.log(chalk.dim(`  Package manager detected: ${chalk.cyan(pm)}\n`));

  const selectedPackages = await checkbox({
    choices: resolvePackages().map((p) => ({
      name: `${p.packageName}  ${chalk.dim(`(${p.type})`)}`,
      value: p,
    })),
    message: 'Select packages to install:',
  });

  if (!selectedPackages.length) {
    console.log(chalk.yellow('\nNo packages selected.'));

    return;
  }

  const packageNames = selectedPackages.map((p) => p.packageName);
  const command = getInstallCommand(pm, packageNames);

  console.log(chalk.bold('\nInstalling packages...'));
  console.log(chalk.dim(`  $ ${command}\n`));

  try {
    execSync(command, { cwd, stdio: 'inherit' });
  } catch {
    console.error(chalk.red('\nInstallation failed. Please check the output above.'));
    process.exit(1);
  }

  console.log(chalk.bold.green('\nPackages installed!'));
  console.log(chalk.bold('\nLinking installed packages...\n'));

  const { agents, skills } = scanNodeModules(cwd);
  const installedAgents = agents.filter((a) => packageNames.includes(a.packageName));
  const installedSkills = skills.filter((s) => packageNames.includes(s.packageName));

  await linkPackages({ agents: installedAgents, skills: installedSkills });
};

const args = hideBin(process.argv);

if (args.length === 0) {
  const command = await select({
    choices: [
      {
        description: 'Browse and install available agents and skills',
        name: 'add',
        value: 'add' as const,
      },
      {
        description: 'Link installed agents and skills to AI platforms',
        name: 'link',
        value: 'link' as const,
      },
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
    .command(
      'link',
      'Link installed agents and skills to AI platforms',
      (yargs) =>
        yargs
          .option('platforms', {
            alias: 'p',
            describe: `Comma-separated platform IDs (${AGENT_PLATFORMS.map((p) => p.id).join(', ')})`,
            type: 'string',
          })
          .option('all', {
            alias: 'a',
            describe: 'Link all discovered agents and skills',
            type: 'boolean',
          })
          .option('agents', {
            describe: 'Comma-separated agent package names or short names to link',
            type: 'string',
          })
          .option('skills', {
            describe: 'Comma-separated skill package names or short names to link',
            type: 'string',
          }),
      async (argv) => runLink(argv)
    )
    .command('add', 'Browse and install available agents and skills', {}, runAdd)
    .strict()
    .help()
    .alias('h', 'help')
    .parse();
}

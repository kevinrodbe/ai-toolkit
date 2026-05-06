import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { git, parseArgs, readJson } from './utils.js';

const main = () => {
	const { projectRoot, projectName } = parseArgs(process.argv, ['--projectRoot', '--projectName']);

	if (!projectRoot) {
		console.error('Error: --projectRoot argument is required');
		process.exit(1);
	}

	const absoluteProjectRoot = resolve(projectRoot);
	const packageJsonPath = join(absoluteProjectRoot, 'package.json');

	if (!existsSync(packageJsonPath)) {
		console.error(`package.json not found at: ${packageJsonPath}`);
		process.exit(1);
	}

	const { version } = readJson(packageJsonPath);

	if (!version) {
		console.error(`No version field found in ${packageJsonPath}`);
		process.exit(1);
	}

	const tag = `${projectName}-${version}`;
	const message = `chore(${projectName}): release version ${version} [skip ci]`;

	git('add -u');
	git(`commit --no-verify -m "${message}"`);

	try {
		git(`tag -d ${tag}`);
	} catch {
		console.log(`tag ${tag} does not exist, creating new tag...`);
	}
	git(`tag ${tag}`);

	git('push --no-verify');
	git(`push origin ${tag} --no-verify`);
};

main();

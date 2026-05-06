import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

/** @param {string} cmd */
const git = cmd => execSync(`git ${cmd}`, { stdio: 'inherit' });

/** @param {string} filePath */
const readJson = filePath => JSON.parse(readFileSync(filePath, 'utf-8'));

/** @param {string[]} argv */
const parseArgs = argv => {
	const args = argv.slice(2);
	const get = flag => {
		const separateIdx = args.findIndex(a => a === flag);
		if (separateIdx !== -1) return args[separateIdx + 1];
		const inline = args.find(a => a.startsWith(`${flag}=`));
		if (inline) return inline.split('=')[1];
		return undefined;
	};
	return { projectRoot: get('--projectRoot'), projectName: get('--projectName') };
};

const main = () => {
	const { projectRoot, projectName } = parseArgs(process.argv);

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

	console.log(`Released: ${tag}`);
};

main();

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const VERSION_PATTERN = /version:\s*"[^"]*"/;

/** @param {string} cmd */
const git = cmd => execSync(`git ${cmd}`, { stdio: 'inherit' });

/** @param {string} filePath */
const readJson = filePath => /** @type {Record<string, string>} */ (JSON.parse(readFileSync(filePath, 'utf-8')));

/** @param {string[]} argv */
const parseArgs = argv => {
	const args = argv.slice(2);

	const separateFlagIndex = args.findIndex(arg => arg === '--projectRoot');
	if (separateFlagIndex !== -1) {
		return { projectRoot: args[separateFlagIndex + 1] };
	}

	const inlineArg = args.find(arg => arg.startsWith('--projectRoot='));
	if (inlineArg) {
		return { projectRoot: inlineArg.split('=')[1] };
	}

	return { projectRoot: undefined };
};

/**
 * @param {string} content
 * @param {string} newVersion
 */
const updateFrontmatterVersion = (content, newVersion) => {
	const lines = content.split('\n');
	let frontmatterOpen = false;
	let frontmatterDone = false;
	let inMetadata = false;
	let updated = false;

	const result = lines.map(line => {
		if (!frontmatterOpen && !frontmatterDone && line.trim() === '---') {
			frontmatterOpen = true;
			return line;
		}

		if (frontmatterOpen && line.trim() === '---') {
			frontmatterOpen = false;
			frontmatterDone = true;
			inMetadata = false;
			return line;
		}

		if (frontmatterOpen) {
			if (/^metadata:/.test(line)) {
				inMetadata = true;
			} else if (inMetadata && /^\S/.test(line)) {
				inMetadata = false;
			}

			if (inMetadata && /^\s+version:\s/.test(line)) {
				updated = true;
				return line.replace(VERSION_PATTERN, `version: "${newVersion}"`);
			}
		}

		return line;
	});

	return { content: result.join('\n'), updated };
};

const main = () => {
	const { projectRoot } = parseArgs(process.argv);

	if (!projectRoot) {
		console.error('Error: --projectRoot argument is required');
		process.exit(1);
	}

	const absoluteProjectRoot = resolve(projectRoot);
	// /Users/m-user/projects/test/ia/ia-toolkit-test-nx/packages/skills/ts
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

	const projectJsonPath = join(absoluteProjectRoot, 'project.json');
	if (!existsSync(projectJsonPath)) {
		console.error(`project.json not found at: ${projectJsonPath}`);
		process.exit(1);
	}

	const { name: projectName } = readJson(projectJsonPath);

	const skillMdPath = join(absoluteProjectRoot, 'src', 'SKILL.md');
	if (!existsSync(skillMdPath)) {
		console.log(`No SKILL.md found at ${skillMdPath} — skipping`);
		process.exit(0);
	}

	const original = readFileSync(skillMdPath, 'utf-8');
	const { content: updatedContent, updated } = updateFrontmatterVersion(original, version);

	if (!updated) {
		console.log(`SKILL.md at ${skillMdPath} has no metadata.version field — skipping`);
		process.exit(0);
	}

	writeFileSync(skillMdPath, updatedContent, 'utf-8');
	console.log(`Synced SKILL.md version → ${version} (${skillMdPath})`);

	const commitMessage = `chore(${projectName}): release version ${version} [skip ci]`;

	// git(`add "${skillMdPath}"`);
	// git(`commit --no-verify -m "${commitMessage}"`);
	// git('push');
};

main();

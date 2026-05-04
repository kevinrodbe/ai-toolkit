import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

function parseArgs(argv) {
	/**
	[
		'/Users/m-user/.volta/tools/image/node/22.18.0/bin/node',
		'/Users/m-user/projects/test/ia/ia-toolkit-test-nx/scripts/sync-skill-version.js',
		'--projectRoot',
		'packages/skills/ts'
	]
	[
		'/Users/m-user/.volta/tools/image/node/22.18.0/bin/node',
		'/Users/m-user/projects/test/ia/ia-toolkit-test-nx/scripts/sync-skill-version.js',
		'--projectRoot=packages/skills/ts'
	]
	 */
	const args = argv.slice(2);
	let projectRoot;
	for (let i = 0; i < args.length; i++) {
		if (args[i] === '--projectRoot') {
			projectRoot = args[i + 1];
			break;
		} else if (args[i].startsWith('--projectRoot=')) {
			projectRoot = args[i].split('=')[1];
			break;
		}
	}
	return { projectRoot };
}

function updateFrontmatterVersion(content, newVersion) {
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
				return line.replace(/version:\s*"[^"]*"/, `version: "${newVersion}"`);
			}
		}

		return line;
	});

	return { content: result.join('\n'), updated };
}

function main() {
	const { projectRoot } = parseArgs(process.argv);

	if (!projectRoot) {
		console.error('Error: --projectRoot argument is required');
		process.exit(1);
	}

	const absProjectRoot = resolve(projectRoot);
	// /Users/m-user/projects/test/ia/ia-toolkit-test-nx/packages/skills/ts
	const packageJsonPath = join(absProjectRoot, 'package.json');
	if (!existsSync(packageJsonPath)) {
		console.error(`package.json not found at: ${packageJsonPath}`);
		process.exit(1);
	}

	const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
	if (!version) {
		console.error(`No version field found in ${packageJsonPath}`);
		process.exit(1);
	}

	const projectJsonPath = join(absProjectRoot, 'project.json');
	if (!existsSync(projectJsonPath)) {
		console.error(`project.json not found at: ${projectJsonPath}`);
		process.exit(1);
	}

	const { name: projectName } = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));

	const skillMdPath = join(absProjectRoot, 'src', 'SKILL.md');
	if (!existsSync(skillMdPath)) {
		console.log(`No SKILL.md found at ${skillMdPath} — skipping`);
		process.exit(0);
	}

	const original = readFileSync(skillMdPath, 'utf-8');
	const { content, updated } = updateFrontmatterVersion(original, version);

	if (!updated) {
		console.log(`SKILL.md at ${skillMdPath} has no metadata.version field — skipping`);
		process.exit(0);
	}

	writeFileSync(skillMdPath, content, 'utf-8');
	console.log(`Synced SKILL.md version → ${version} (${skillMdPath})`);

	const commitMessage = `chore($${projectName}): release version ${version} [skip ci]`;
	/** @param {string} cmd */
	const git = cmd => execSync(`git ${cmd}`, { stdio: 'inherit' });

	// git(`add "${skillMdPath}"`);
	// git(`commit --no-verify -m "${commitMessage}"`);
	// git('push');

	console.log(`Committed and pushed: ${commitMessage}`);
}

main();

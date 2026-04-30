import { writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENVIRONMENT } from './constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const outputPath = process.env.GITHUB_STEP_SUMMARY;

if (!outputPath) {
	console.log('GITHUB_STEP_SUMMARY not set, skipping summary generation');
	process.exit(0);
}

function buildProjectMap() {
	const map = new Map();
	for (const dir of ['packages', 'apps']) {
		const dirPath = join(rootDir, dir);
		if (!existsSync(dirPath)) continue;
		for (const entry of readdirSync(dirPath)) {
			const projectJsonPath = join(dirPath, entry, 'project.json');
			const packageJsonPath = join(dirPath, entry, 'package.json');
			if (existsSync(projectJsonPath) && existsSync(packageJsonPath)) {
				const { name } = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
				map.set(name, packageJsonPath);
			}
		}
	}
	return map;
}

function getAffectedProjects() {
	try {
		const result = execSync('pnpm nx print-affected --select=projects --type=lib', {
			cwd: rootDir,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		}).trim();
		return result ? result.split(',').map((p) => p.trim()).filter(Boolean) : [];
	} catch (err) {
		console.warn('Could not get affected projects:', err instanceof Error ? err.message : err);
		return [];
	}
}

const projectMap = buildProjectMap();
const affectedProjects = getAffectedProjects();

const rows = affectedProjects
	.map((projectName) => {
		const packageJsonPath = projectMap.get(projectName);
		if (!packageJsonPath) return null;
		const { name, version } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
		return `| \`${name}\` | \`${version}\` |`;
	})
	.filter(Boolean);

const summary =
	rows.length > 0
		? `
## Release Summary

**Environment:** \`${ENVIRONMENT}\`

| Package | Version |
|---------|---------|
${rows.join('\n')}
`
		: `
## Release Summary

**Environment:** \`${ENVIRONMENT}\`

No affected projects found.
`;

writeFileSync(outputPath, summary, { flag: 'a' });
console.log('Job summary written.');

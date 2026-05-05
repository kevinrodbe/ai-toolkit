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

/** @param {string} dir @param {Map<string, string>} map */
function findProjects(dir, map) {
	if (!existsSync(dir)) return;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;
		const entryPath = join(dir, entry.name);
		const projectJsonPath = join(entryPath, 'project.json');
		const packageJsonPath = join(entryPath, 'package.json');
		if (existsSync(projectJsonPath) && existsSync(packageJsonPath)) {
			const { name } = JSON.parse(readFileSync(projectJsonPath, 'utf-8'));
			map.set(name, packageJsonPath);
		} else {
			findProjects(entryPath, map);
		}
	}
}

function buildProjectMap() {
	const map = new Map();
	for (const dir of ['packages', 'apps']) {
		findProjects(join(rootDir, dir), map);
	}
	return map;
}

function getAffectedProjects() {
	try {
		const result = execSync('pnpm nx show projects --affected --json', {
			cwd: rootDir,
			encoding: 'utf-8',
			stdio: ['pipe', 'pipe', 'pipe'],
		}).trim();
		if (!result) return [];
		const parsed = JSON.parse(result);
		return Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		console.warn('Could not get affected projects:', err instanceof Error ? err.message : err);
		return [];
	}
}

const projectMap = buildProjectMap();
const affectedProjects = getAffectedProjects();
console.log('Affected projects:', affectedProjects.length > 0 ? affectedProjects.join(', ') : 'none');

const rows = affectedProjects
	.map(projectName => {
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

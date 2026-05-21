import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const SCOPE = '@kevinrodbe';

export interface SkillPackage {
	name: string;
	shortName: string;
	packageName: string;
	srcDir: string;
}

export interface AgentPackage {
	name: string;
	shortName: string;
	packageName: string;
	srcDir: string;
}

interface ScanResult {
	skills: SkillPackage[];
	agents: AgentPackage[];
}

export const scanNodeModules = (cwd: string): ScanResult => {
	const scopeDir = join(cwd, 'node_modules', SCOPE);

	if (!existsSync(scopeDir)) {
		return { agents: [], skills: [] };
	}

	const packages = readdirSync(scopeDir);
	const skills: SkillPackage[] = [];
	const agents: AgentPackage[] = [];

	for (const pkg of packages) {
		if (pkg.startsWith('skill-')) {
			const srcDir = join(scopeDir, pkg, 'src');

			if (existsSync(srcDir)) {
				const shortName = pkg.replace(/^skill-/, '');

				skills.push({ name: pkg, packageName: `${SCOPE}/${pkg}`, shortName, srcDir });
			}
		} else if (pkg.startsWith('agent-')) {
			const srcDir = join(scopeDir, pkg, 'src');

			if (existsSync(srcDir)) {
				const shortName = pkg.replace(/^agent-/, '');

				agents.push({ name: pkg, packageName: `${SCOPE}/${pkg}`, shortName, srcDir });
			}
		}
	}

	return { agents, skills };
};

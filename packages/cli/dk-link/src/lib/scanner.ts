import fs from 'node:fs';
import path from 'node:path';

const SCOPE = '@kevinrodbe';

export interface SkillPackage {
	name: string;
	shortName: string;
	packageName: string;
	srcDir: string;
}

export interface AgentFile {
	fileName: string;
	filePath: string;
}

export interface AgentPackage {
	name: string;
	packageName: string;
	files: AgentFile[];
}

export interface ScanResult {
	skills: SkillPackage[];
	agents: AgentPackage[];
}

export function scanNodeModules(cwd: string): ScanResult {
	const scopeDir = path.join(cwd, 'node_modules', SCOPE);

	if (!fs.existsSync(scopeDir)) {
		return { agents: [], skills: [] };
	}

	const packages = fs.readdirSync(scopeDir);
	const skills: SkillPackage[] = [];
	const agents: AgentPackage[] = [];

	for (const pkg of packages) {
		if (pkg.startsWith('skill-')) {
			const srcDir = path.join(scopeDir, pkg, 'src');
			if (fs.existsSync(srcDir)) {
				const shortName = pkg.replace(/^skill-/, '');
				skills.push({ name: pkg, packageName: `${SCOPE}/${pkg}`, shortName, srcDir });
			}
		} else if (pkg.startsWith('agent-')) {
			const srcDir = path.join(scopeDir, pkg, 'src');
			if (fs.existsSync(srcDir)) {
				const files = fs
					.readdirSync(srcDir)
					.filter(f => f.endsWith('.md'))
					.map(f => ({ fileName: f, filePath: path.join(srcDir, f) }));
				if (files.length > 0) {
					agents.push({ files, name: pkg, packageName: `${SCOPE}/${pkg}` });
				}
			}
		}
	}

	return { agents, skills };
}

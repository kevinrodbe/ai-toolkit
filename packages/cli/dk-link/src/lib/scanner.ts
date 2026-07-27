import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const SCOPE = '@kevinrodbe';

export interface SkillPackage {
  name: string; // skill-foo
  packageName: string; // @kevinrodbe/skill-foo
  shortName: string; // foo
  srcDir: string;
}

export interface AgentPackage {
  name: string;
  packageName: string;
  shortName: string;
  srcDir: string;
}

interface ScanResult {
  agents: Array<AgentPackage>;
  skills: Array<SkillPackage>;
}

export const scanNodeModules = (cwd: string): ScanResult => {
  const scopeDir = join(cwd, 'node_modules', SCOPE);

  if (!existsSync(scopeDir)) {
    return { agents: [], skills: [] };
  }

  const packages = readdirSync(scopeDir);
  const skills: Array<SkillPackage> = [];
  const agents: Array<AgentPackage> = [];

  for (const pkg of packages) {
    if (pkg.startsWith('skill-')) {
      const srcDir = join(scopeDir, pkg);

      if (existsSync(srcDir)) {
        const shortName = pkg.replace(/^skill-/, '');

        skills.push({ name: pkg, packageName: `${SCOPE}/${pkg}`, shortName, srcDir });
      }
    } else if (pkg.startsWith('agent-')) {
      const srcDir = join(scopeDir, pkg);

      if (existsSync(srcDir)) {
        const shortName = pkg.replace(/^agent-/, '');

        agents.push({ name: pkg, packageName: `${SCOPE}/${pkg}`, shortName, srcDir });
      }
    }
  }

  return { agents, skills };
};

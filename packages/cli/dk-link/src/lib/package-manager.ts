import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

const isCommandAvailable = (cmd: string): boolean => {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });

    return true;
  } catch {
    return false;
  }
};

const readPackageManagerField = (cwd: string): PackageManager | null => {
  const pkgPath = join(cwd, 'package.json');

  if (!existsSync(pkgPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { packageManager?: string };
    const pm = pkg.packageManager;

    if (!pm) {
      return null;
    }

    if (pm.startsWith('pnpm')) {
      return 'pnpm';
    }
    if (pm.startsWith('yarn')) {
      return 'yarn';
    }
    if (pm.startsWith('bun')) {
      return 'bun';
    }
    if (pm.startsWith('npm')) {
      return 'npm';
    }
  } catch {
    // ignore parse errors
  }

  return null;
};

const detectLockFile = (cwd: string): PackageManager | null => {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) {
    return 'bun';
  }
  if (existsSync(join(cwd, 'package-lock.json'))) {
    return 'npm';
  }

  return null;
};

/**
 * Detects the package manager in use with the following priority:
 * 1. Lock file presence (pnpm-lock.yaml, package-lock.json, yarn.lock, bun.lockb)
 * 2. `packageManager` field in package.json
 * 3. pnpm available in PATH → pnpm
 * 4. Fallback → npm
 */
export const detectPackageManager = (cwd: string): PackageManager => {
  return (
    detectLockFile(cwd) ??
    readPackageManagerField(cwd) ??
    (isCommandAvailable('pnpm') ? 'pnpm' : 'npm')
  );
};

export const getInstallCommand = (pm: PackageManager, packages: Array<string>): string => {
  const pkgList = packages.join(' ');

  switch (pm) {
    case 'pnpm':
      return `pnpm add -D ${pkgList}`;
    case 'yarn':
      return `yarn add -D ${pkgList}`;
    case 'bun':
      return `bun add -D ${pkgList}`;
    case 'npm':
    default:
      return `npm install -D ${pkgList}`;
  }
};

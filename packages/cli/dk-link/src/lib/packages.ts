export type PackageType = 'agent' | 'skill';

export interface AvailablePackage {
	name: string;
	packageName: string;
	type: PackageType;
}

export const AVAILABLE_PACKAGES = [
	'@kevinrodbe/skill-ng',
	'@kevinrodbe/skill-ts',
	'@kevinrodbe/skill-go',
	'@kevinrodbe/agent-code-reviewer',
] as const;

const deriveType = (packageName: string): PackageType => {
	const shortName = packageName.split('/')[1] ?? '';

	if (shortName.startsWith('skill-')) {
		return 'skill';
	}
	if (shortName.startsWith('agent-')) {
		return 'agent';
	}

	throw new Error(`Cannot derive type from package name: "${packageName}"`);
};

export const resolvePackages = (): AvailablePackage[] =>
	AVAILABLE_PACKAGES.map(packageName => {
		const name = packageName.split('/')[1] ?? packageName;
		const type = deriveType(packageName);

		return { name, packageName, type };
	});

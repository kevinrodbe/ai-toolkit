import { RuleConfigSeverity, type RuleConfigTuple } from '@commitlint/types';
import { getProjects as getNXProjects } from 'nx/src/generators/utils/project-configuration';
import { FsTree } from 'nx/src/generators/tree';
import { type ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

const Rules = {
	'scope-enum': () =>
		Promise.resolve([RuleConfigSeverity.Error, 'always', getScopes()] satisfies RuleConfigTuple<string[]>),
} as const;

export default Rules;

/**
 *  Get the list of project names to be used as scopes
 *  The list of scopes is generated based on the project names, project types, and tags
 *  The list of scopes also includes predefined scopes like 'project' and 'version'
 *
 *  @see {@link https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-nx-scopes}
 *
 *
 * @param cwd the current working directory for nx projects
 * @param selector  a function to filter the projects based on the project name, project type, and tags
 * @returns an array of project names to be used as scopes
 */
function getScopes(
	cwd = process.cwd(),
	selector: (params: Pick<ProjectConfiguration, 'name' | 'projectType' | 'tags'>) => boolean = () => true
) {
	const projects = getNXProjects(new FsTree(cwd, false));
	const projectScopes = Array.from(projects.entries())
		.map(([name, project]) => ({
			name,
			...project,
		}))
		.filter(project =>
			selector({
				name: project.name,
				projectType: project.projectType,
				tags: project.tags,
			})
		)
		.filter(project => project.targets)
		.map(project => project.name)
		.map(name => (name.charAt(0) === '@' ? (name.split('/')[1] ?? name) : name));

	const predefinedScopes = ['root project', 'project structure', 'project dependencies', 'version'] as const;

	return [...projectScopes, ...predefinedScopes];
}

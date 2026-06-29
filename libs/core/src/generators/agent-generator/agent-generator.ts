import * as path from 'path';

import { type Tree, addProjectConfiguration, formatFiles, generateFiles } from '@nx/devkit';

import { type AgentGeneratorSchema } from './schema';
import { kebabCase } from '../../utils';

export async function agentGenerator(tree: Tree, options: AgentGeneratorSchema) {
  const kebabName = kebabCase(options.name);

  const projectRoot = `packages/agents/${kebabName}`;

  addProjectConfiguration(tree, kebabName, {
    name: kebabName,
    projectType: 'library',
    root: projectRoot,
    sourceRoot: `${projectRoot}/src`,
    tags: ['type:library', 'destination:feed'],
    targets: {
      'commit-tag-push': {
        executor: 'nx:run-commands',
        options: {
          command:
            'node scripts/commit-tag-push.js --projectRoot {projectRoot} --projectName {projectName}',
        },
      },
      github: {
        executor: '@jscutlery/semver:github',
        options: {
          notes: '${notes}',
          tag: '${tag}',
        },
      },
      prerelease: {
        executor: '@jscutlery/semver:version',
        options: {
          allowEmptyRelease: true,
          noVerify: true,
          preset: 'conventional',
          push: false,
          releaseAs: 'prerelease',
          skipCommit: true,
          skipProjectChangelog: true,
          skipRootChangelog: true,
          trackDeps: true,
        },
      },
      'publish:root': {
        executor: 'nx:run-commands',
        options: {
          command: `pnpm -F @kevinrodbe/agent-${kebabName} publish --no-git-checks`,
        },
      },
      'sync-md-version': {
        executor: 'nx:run-commands',
        options: {
          command:
            'node scripts/sync-md-version.js --projectRoot {projectRoot} --capabilityType agent',
        },
      },
      version: {
        executor: '@jscutlery/semver:version',
        options: {
          allowEmptyRelease: true,
          commitMessageFormat: 'chore({projectName}): release version ${version} [skip ci]',
          noVerify: true,
          postTargets: ['sync-md-version', 'commit-tag-push', 'github'],
          preset: 'conventional',
          push: false,
          skipCommit: true,
          trackDeps: true,
        },
      },
    },
  });
  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, { ...options, kebabName });
  await formatFiles(tree);
}

export default agentGenerator;

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parseArgs, readJson } from './utils.js';

const VERSION_PATTERN = /version:\s*"[^"]*"/;

/**
 * @param {string} content
 * @param {string} newVersion
 */
const updateFrontmatterVersion = (content, newVersion) => {
  const lines = content.split('\n');
  let frontmatterOpen = false;
  let frontmatterDone = false;
  let inMetadata = false;
  let metadataLineIndex = -1;
  let frontmatterCloseIndex = -1;
  let versionFound = false;

  const result = lines.map((line, i) => {
    if (!frontmatterOpen && !frontmatterDone && line.trim() === '---') {
      frontmatterOpen = true;

      return line;
    }

    if (frontmatterOpen && line.trim() === '---') {
      frontmatterOpen = false;
      frontmatterDone = true;
      frontmatterCloseIndex = i;
      inMetadata = false;

      return line;
    }

    if (frontmatterOpen) {
      if (/^metadata:/.test(line)) {
        inMetadata = true;
        metadataLineIndex = i;
      } else if (inMetadata && /^\S/.test(line)) {
        inMetadata = false;
      }

      if (inMetadata && /^\s+version:\s/.test(line)) {
        versionFound = true;

        return line.replace(VERSION_PATTERN, `version: "${newVersion}"`);
      }
    }

    return line;
  });

  if (versionFound) {
    return { content: result.join('\n'), updated: true };
  }

  if (metadataLineIndex !== -1) {
    result.splice(metadataLineIndex + 1, 0, `  version: "${newVersion}"`);
  } else if (frontmatterCloseIndex !== -1) {
    result.splice(frontmatterCloseIndex, 0, 'metadata:', `  version: "${newVersion}"`);
  } else {
    return { content, updated: false };
  }

  return { content: result.join('\n'), updated: true };
};

/**
 * @param {string} capabilityType - agent or skill
 */
const getMdFile = (capabilityType = 'skill') => {
  if (capabilityType === 'agent') {
    return 'AGENT.md';
  }

  return 'SKILL.md';
};

const main = () => {
  const { projectRoot, capabilityType } = parseArgs(process.argv, [
    '--projectRoot',
    '--capabilityType',
  ]);

  if (!projectRoot) {
    console.error('❌ Error: --projectRoot argument is required');
    process.exit(1);
  }

  const absoluteProjectRoot = resolve(projectRoot);
  const packageJsonPath = join(absoluteProjectRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.error(`❌ Error: package.json not found at: ${packageJsonPath}`);
    process.exit(1);
  }

  const { version } = readJson(packageJsonPath);

  if (!version) {
    console.error(`❌ Error: No version field found in ${packageJsonPath}`);
    process.exit(1);
  }

  const projectJsonPath = join(absoluteProjectRoot, 'project.json');

  if (!existsSync(projectJsonPath)) {
    console.error(`❌ Error: project.json not found at: ${projectJsonPath}`);
    process.exit(1);
  }

  const mainMdPath = join(absoluteProjectRoot, 'src', getMdFile(capabilityType));

  if (!existsSync(mainMdPath)) {
    console.log(`⚠️ Warning: ${mainMdPath} not found — skipping`);
    process.exit(0);
  }

  const original = readFileSync(mainMdPath, 'utf-8');
  const { content: updatedContent, updated } = updateFrontmatterVersion(original, version);

  if (!updated) {
    console.log(`⚠️ Warning: ${mainMdPath} has no frontmatter — skipping`);
    process.exit(0);
  }

  writeFileSync(mainMdPath, updatedContent, 'utf-8');
  console.log(`✅ Synced "${mainMdPath}" version → ${version}`);
};

main();

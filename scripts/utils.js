import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** @param {string} cmd */
export const git = cmd => execSync(`git ${cmd}`, { stdio: 'inherit' });

/** @param {string} filePath */
export const readJson = filePath => /** @type {Record<string, string>} */ (JSON.parse(readFileSync(filePath, 'utf-8')));

/**
 * @param {string[]} argv
 * @param {string[]} flags - e.g. ['--projectName', '--projectRoot']
 */
export const parseArgs = (argv, flags) => {
	const args = argv.slice(2);

	/** @param {string} flag */
	const get = flag => {
		const separateIdx = args.findIndex(a => a === flag);

		if (separateIdx !== -1) {
			return args[separateIdx + 1];
		}
		const inline = args.find(a => a.startsWith(`${flag}=`));

		if (inline) {
			return inline.split('=')[1];
		}

		return undefined;
	};

	return Object.fromEntries(flags.map(flag => [flag.replace(/^--/, ''), get(flag)]));
};

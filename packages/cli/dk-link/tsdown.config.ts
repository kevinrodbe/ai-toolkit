import { defineConfig } from 'tsdown';

export default defineConfig({
	dts: false,
	entry: { 'commands/dk-link': 'src/commands/dk-link.ts' },
	format: 'esm',
	outExtensions: () => ({ js: '.js' }),
	platform: 'node',
});

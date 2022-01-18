const esbuild = require('esbuild')
const { resolvePlugin } = require('../../scripts/esbuild/esbuild')

esbuild.build({
	entryPoints: ['./packages/cli/src/run.ts'],
	bundle: true,
	platform: 'node',
	sourcemap: 'external',
	outfile: './dist/run.js',
	plugins: [resolvePlugin],
	external: ['pg-native', 'electron', 'typescript', 'ts-node'],
}).catch(e => {
	console.error(e)
	process.exit(1)
})

import esbuild from 'esbuild'
import { resolvePlugin } from '../../scripts/esbuild/esbuild'

esbuild.build({
	entryPoints: ['./packages/cli/src/run.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	sourcemap: 'external',
	outfile: './dist/run',
	plugins: [resolvePlugin],
	external: ['pg-native', 'electron', 'esbuild', 'vm2'],
}).catch(e => {
	console.error(e)
	process.exit(1)
})

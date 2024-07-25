const esbuild = require('esbuild')
const path = require('path')

const root = path.dirname(path.dirname(__dirname))

esbuild.build({
	entryPoints: ['./packages/cli/src/run.ts'],
	bundle: true,
	platform: 'node',
	sourcemap: 'external',
	outfile: './dist/run.js',
	plugins: [
		{
			name: 'resolve contember',
			setup(build) {
				build.onResolve({filter: /^@contember\/.+$/}, args => {
					const pkg = args.path.match(/@contember\/(.+)/)[1]
					return {path: path.join(root, 'packages', pkg, pkg.includes('/') ? 'index.ts' : 'src/index.ts')}
				})
			},
		},
	],
	external: ['pg-native', 'electron', 'esbuild', 'vm2'],
}).catch(e => {
	console.error(e)
	process.exit(1)
})

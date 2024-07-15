const path = require('path')
const esbuild = require('esbuild')
const {nodeExternalsPlugin} = require('esbuild-node-externals');
const glob = require('fast-glob')

const root = path.dirname(path.dirname(__dirname))

;(async () => {
	const packageJsonFiles = await glob('packages/*/package.json')
	const buildServer = entrypoint => esbuild.build({
		entryPoints: [entrypoint],
		bundle: true,
		platform: 'node',
		format: 'esm',
		sourcemap: 'external',
		outfile: './server/server.js',
		plugins: [
			nodeExternalsPlugin({
				packagePath: packageJsonFiles,
				allowList: it => it.startsWith('@contember/')
			}),
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
	})

	await buildServer('./packages/engine-server/src/start.ts')

})()
.catch(e => {
	console.error(e)
	process.exit(1)
})



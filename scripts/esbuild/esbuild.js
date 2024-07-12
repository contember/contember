const path = require('path')
const esbuild = require('esbuild')

const root = path.dirname(path.dirname(__dirname))

const resolvePlugin = {
	name: 'resolve contember',
	setup(build) {
		build.onResolve({ filter: /^@contember\/.+$/ }, args => {
			const pkg = args.path.match(/@contember\/(.+)/)[1]
			return { path: path.join(root, 'packages', pkg, pkg.includes('/') ? 'index.ts' : 'src/index.ts') }
		})
	},
}

const buildServer = entrypoint => esbuild.build({
	entryPoints: [entrypoint],
	bundle: true,
	platform: 'node',
	sourcemap: 'external',
	outfile: './server/server.js',
	plugins: [resolvePlugin],
	external: ['pg-native', 'mock-aws-s3', 'aws-sdk', 'nock'],
})

module.exports = { resolvePlugin, buildServer }

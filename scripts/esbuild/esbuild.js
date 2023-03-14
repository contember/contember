const path = require('path')
const esbuild = require('esbuild')

const root = path.dirname(path.dirname(__dirname))

const eePackages = [
	'engine-actions',
	'engine-server-ee',
]

const resolvePlugin = {
	name: 'resolve contember',
	setup(build) {
		build.onResolve({ filter: /^@contember\/.+$/ }, args => {
			const pkg = args.path.match(/@contember\/(.+)/)[1]
			const baseDir = eePackages.includes(pkg) ? 'ee' : 'packages'
			return { path: path.join(root, baseDir, pkg, pkg.includes('/') ? 'index.ts' : 'src/index.ts') }
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
	external: ['pg-native', 'mock-aws-s3', 'aws-sdk', 'nock', 'bcrypt', 'heapdump'],
})

module.exports = { resolvePlugin, buildServer }

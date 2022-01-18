const path = require('path')

const root = path.dirname(path.dirname(__dirname))
const resolvePlugin = {
	name: 'resolve contember',
	setup(build) {
		build.onResolve({ filter: /^@contember\/.+$/ }, args => {
			const pkg = args.path.match(/@contember\/(.+)/)[1]
			return { path: path.join(root, '/packages/', pkg, pkg.includes('/') ? 'index.ts' : 'src/index.ts') }
		})
		build.onResolve({ filter: /\.\.$/ }, args => {
			if (args.resolveDir.endsWith('/migrations')) {
				return { path: path.join(path.dirname(args.resolveDir), '/src/index.ts') }
			}
			return undefined
		})

	},
}
module.exports = { resolvePlugin }

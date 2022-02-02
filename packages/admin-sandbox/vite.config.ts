import { defineConfig } from 'vite'
import { resolve } from 'path'
import { getPackagePath, packageList } from '../../build/packageList.js'
import { rootDirectory } from '../../build/rootDirectory.js'

export default defineConfig({
	root: 'admin',
	esbuild: {
		jsxFactory: '_jsx',
		jsxFragment: '_jsxFragment',
		jsxInject: `import { createElement as _jsx, Fragment as _jsxFragment } from 'react'`,
	},
	resolve: {
		alias: packageList.map(packageName => ({
			find: `@contember/${packageName}`,
			replacement: resolve(rootDirectory, getPackagePath(packageName)),
		})),
	},
})

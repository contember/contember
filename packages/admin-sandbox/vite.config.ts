import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { getPackagePath, packageList } from '../../build/packageList.js'
import { rootDirectory } from '../../build/rootDirectory.js'

export default defineConfig({
	root: 'admin',
	esbuild: {
		jsxFactory: '_jsx',
		jsxFragment: '_jsxFragment',
		jsxInject: `import { createElement as _jsx, Fragment as _jsxFragment } from 'react'`,
	},
	plugins: [reactRefresh()],
	resolve: {
		alias: packageList.map(packageName => ({
			find: `@contember/${packageName}`,
			replacement: resolve(rootDirectory, getPackagePath(packageName)),
		})),
	},
	css: {
		preprocessorOptions: {
			sass: {
				charset: false,
				additionalData: `$inter-font-path: '/@fs/src/packages/ui/src/assets/Inter'\n`,
			},
		},
	},
})

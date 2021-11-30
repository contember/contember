import { defineConfig } from 'vite'
import { resolve } from 'path'
import { getPackagePath, packageList } from '../../build/packageList'
import { rootDirectory } from '../../build/rootDirectory'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
	root: 'public',
	build: {
		assetsDir: '_static',
		outDir: resolve(rootDirectory, `ee/admin-server/dist/public`),
		rollupOptions: {
			input: ['public/index.html', 'public/_panel/index.html'],
			treeshake: {
				moduleSideEffects: (id, external) => {
					return (
						id.endsWith('ee/admin-server/public/index.tsx') ||
						id.endsWith('ee/admin-server/public/_panel/main.tsx')
					)
				},
			},
		},
	},
	esbuild: {
		jsxInject: `import * as React from 'react'`,
		target: 'esnext',
	},
	plugins: [reactRefresh()],
	resolve: {
		alias: [
			...packageList.map(packageName => ({
				find: `@contember/${packageName}`,
				replacement: resolve(rootDirectory, getPackagePath(packageName)),
			})),
		],
	},
})

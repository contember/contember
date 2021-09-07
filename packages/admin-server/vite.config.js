import { defineConfig } from 'vite'
import { resolve } from 'path'
import { packageList } from '../../build/packageList'
import { rootDirectory } from '../../build/rootDirectory'
import reactRefresh from '@vitejs/plugin-react-refresh'

export default defineConfig({
	root: 'public',
	build: {
		assetsDir: '_static',
		outDir: resolve(rootDirectory, `packages/admin-server/dist/public`),
		rollupOptions: {
			input: ['public/index.html', 'public/_panel/index.html'],
			treeshake: {
				moduleSideEffects: (id, external) => {
					return (
						id.endsWith('packages/admin-server/public/main.tsx') ||
						id.endsWith('packages/admin-server/public/_panel/main.tsx')
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
				replacement: resolve(rootDirectory, `packages/${packageName}/src/index.ts`),
			})),
		],
	},
})

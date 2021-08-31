import { defineConfig } from 'vite'
import { resolve } from 'path'
import { rootDirectory } from '../../build/rootDirectory'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { packageList } from '../../build/packageList'

export default defineConfig(async ({ command, mode }) => ({
	build: {
		minify: mode === 'development' ? false : 'terser',
		outDir: resolve(rootDirectory, `packages/admin-server/dist`),
		assetsDir: '_static',
		sourcemap: true,
		target: 'es2020',
		rollupOptions: {
			input: ['public/index.html', 'public/_panel/index.html'],
			treeshake: {
				moduleSideEffects: (id, external) => {
					return id.endsWith('packages/admin-server/public/main.tsx') || id.endsWith('packages/admin-server/public/_panel/main.tsx')
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
}))

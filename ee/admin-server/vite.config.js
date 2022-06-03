import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { getPackagePath, packageList } from '../../build/packageList.js'
import { rootDirectory } from '../../build/rootDirectory.js'

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
	css: {
		preprocessorOptions: {
			sass: {
				charset: false,
				additionalData: `$inter-font-path: '/@fs/src/packages/ui/src/assets/Inter'\n`,
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

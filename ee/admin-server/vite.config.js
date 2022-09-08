import { defineConfig } from 'vite'
import { resolve } from 'path'
import { getPackagePath, packageList } from '../../build/packageList.js'
import { rootDirectory } from '../../build/rootDirectory.js'
import react from '@vitejs/plugin-react'

export default defineConfig({
	root: 'public',
	publicDir: '_public',

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
			},
		},
	},
	esbuild: {
		target: 'esnext',
	},
	plugins: [react],
	resolve: {
		alias: [
			...packageList.map(packageName => ({
				find: `@contember/${packageName}`,
				replacement: resolve(rootDirectory, getPackagePath(packageName)),
			})),
		],
	},
})

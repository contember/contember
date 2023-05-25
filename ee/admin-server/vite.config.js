// @ts-check
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { resolveConfig, rootDirectory } from '../../build'

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
	esbuild: {
		target: 'esnext',
	},
	plugins: [react()],
	resolve: resolveConfig,
})

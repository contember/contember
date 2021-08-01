import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { packageList } from './packageList.js'
import { rootDirectory } from './rootDirectory.js'

export function createViteConfig(packageName) {
	if (!packageList.includes(packageName)) {
		throw new Error(`Invalid package name ${packageName}.`)
	}

	const packageDir = `packages/${packageName}`

	return defineConfig(async ({ command, mode }) => {
		const isDevMode = mode === 'development'
		return {
			build: {
				emptyOutDir: false,
				lib: {
					name: packageName,
					entry: resolve(rootDirectory, `${packageDir}/src/index.ts`),
					formats: ['es'],
				},
				minify: isDevMode ? false : 'terser',
				outDir: resolve(rootDirectory, `${packageDir}/dist`),
				rollupOptions: {
					external: ['react', 'react-dom'],
					output: {
						entryFileNames: `${packageName}.${mode}.js`,
					},
				},
				sourcemap: isDevMode ? 'inline' : false,
				target: isDevMode ? 'esnext' : 'es2020',
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
					{
						find: 'attr-accept',
						replacement: resolve(rootDirectory, `packages/admin/node_modules/attr-accept/src/index.js`),
					},
				],
				dedupe: packageList.map(packageName => `@contember/${packageName}`),
			},
		}
	})
}

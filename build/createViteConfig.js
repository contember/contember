import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { getPackagePath, packageList } from './packageList.js'
import { rootDirectory } from './rootDirectory.js'

export function createViteConfig(packageName) {
	if (!packageList.includes(packageName)) {
		throw new Error(`Invalid package name ${packageName}.`)
	}

	const packageDir = `packages/${packageName}`
	const entry = resolve(rootDirectory, `${packageDir}/src/index.ts`)

	return defineConfig(({ command, mode }) => {
		return {
			build: {
				lib: {
					entry,
					formats: ['es'],
				},
				minify: false,
				outDir: resolve(rootDirectory, `${packageDir}/dist/${mode}`),
				rollupOptions: {
					external: (id, importer, resolved) => {
						return !resolved && !id.startsWith('./') && !id.startsWith('../') && id !== '.' && id !== entry
					},
					output: {
						preserveModules: true,
						entryFileNames: '[name].js',
					},
					treeshake: {
						moduleSideEffects: false,
					},
				},
				sourcemap: true,
				target: 'es2020',
			},
			plugins: [react()],
			resolve: {
				alias: packageList.map(packageName => ({
					find: `@contember/${packageName}`,
					replacement: resolve(rootDirectory, getPackagePath(packageName)),
				})),
				dedupe: packageList.map(packageName => `@contember/${packageName}`),
			},
		}
	})
}

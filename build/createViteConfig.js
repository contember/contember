// @ts-check
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { entries } from './packageList.js'
import { rootDirectory } from './rootDirectory.js'

export const packages = new Map(entries)

/**
 * @param {string} packageName
 * @returns {import('vite').UserConfigExport}
 */
export function createViteConfig(packageName) {
	const packagePath = packages.get(packageName)

	if (!packagePath) {
		throw new Error(`Undefined package path for package "${packageName}".`)
	}

	const entry = resolve(rootDirectory, `${packagePath}/src/index.ts`)

	return defineConfig(({ command, mode }) => {
		return {
			build: {
				lib: {
					entry,
					formats: ['es'],
				},
				minify: false,
				outDir: resolve(rootDirectory, `${packagePath}/dist/${mode}`),
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
			resolve: resolveConfig,
		}
	})
}

/** @type {import('vite').UserConfig['resolve']} */
export const resolveConfig = {
	alias: entries.map(([packageName, packagePath]) => ({
		find: `@contember/${packageName}`,
		replacement: resolve(rootDirectory, `${packagePath}/src`),
	})),
	dedupe: entries.map(([packageName]) => `@contember/${packageName}`),
}

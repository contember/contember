import { defineConfig } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { packages, rootDirectory } from './packages'
import { resolveConfig } from './resolveConfig.js'

const extraEntrypoints = {
	'engine-server': ['start'],
	'cli': ['run'],
	'create': ['run'],
	'client-content-generator': ['generate', 'index'],
	playground: [],
}

export default defineConfig(({ command, mode }) => {

	const inputs = Object.fromEntries(Array.from(packages.entries()).flatMap(([packageName, packagePath]) => {
		if (extraEntrypoints[packageName]) {
			return extraEntrypoints[packageName].map((entrypoint, i) => [packageName + '/' + entrypoint, resolve(rootDirectory, `${packagePath}/src/${entrypoint}.ts`)])
		}
		return [[packageName + '/' + 'index', resolve(rootDirectory, `${packagePath}/src/index.ts`)]]
	}))

	const inputPaths = new Set(Object.values(inputs))

	return ({
		esbuild: {
			target: 'es2020',
		},
		build: {
			minify: false,
			// lib: {},
			ssr: true,
			outDir: resolve(rootDirectory, `dist/${mode}`),
			modulePreload: false,
			rollupOptions: {
				input: inputs,
				external: (id, importer, resolved) => {
					return !resolved && !id.startsWith('./') && !id.startsWith('../') && id !== '.' && !inputPaths.has(id)
				},
				output: [
					{
						format: 'esm',
						preserveModules: true,
						entryFileNames: '[name].js',
					},
					{
						format: 'cjs',
						preserveModules: true,
						entryFileNames: '[name].cjs',
					},
				],
				// treeshake: {
				// 	moduleSideEffects: false,
				// },
				preserveEntrySignatures: 'strict',
			},
			sourcemap: true,
			target: 'es2020',
		},
		plugins: [react()],

		resolve: resolveConfig,
	})
})


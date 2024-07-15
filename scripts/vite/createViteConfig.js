import {defineConfig} from 'vitest/config'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {readFileSync} from 'node:fs'
import {resolve} from 'path'
import react from '@vitejs/plugin-react'

export const rootDirectory = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

const tsconfig = JSON.parse(readFileSync(join(rootDirectory, './tsconfig.json'), 'utf8'))
// in format ./packages/admin => convert to map with "admin" as a key and packages/admin as a value
const references = tsconfig.references.map(reference => reference.path)
const packages = new Map(references.map(reference => [reference.split('/').pop(), reference.substring(2)]))


export const createViteConfig = (packageName, entrypoint = 'index.ts') => {
	const packagePath = packages.get(packageName)

	if (!packagePath) {
		throw new Error(`Undefined package path for package "${packageName}".`)
	}

	const entry = resolve(rootDirectory, `${packagePath}/src/${entrypoint}`)
	return defineConfig(({command, mode}) => ({
		esbuild: {
			target: 'es2020',
		},
		build: {
			lib: {
				entry,
			},
			minify: false,
			outDir: resolve(rootDirectory, `${packagePath}/dist/${mode}`),
			rollupOptions: {
				external: (id, importer, resolved) => {
					return !resolved && !id.startsWith('./') && !id.startsWith('../') && id !== '.' && id !== entry
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
				treeshake: {
					moduleSideEffects: false,
				},
			},
			sourcemap: true,
			target: 'es2020',
		},
		plugins: [react()],
		test: {
			environment: 'jsdom',
		},
		resolve: {
			dedupe: ['graphql'],
			alias: {
				alias: Object.entries(packages).map(([packageName, packagePath]) => ({
					find: `@contember/${packageName}`,
					replacement: resolve(rootDirectory, `${packagePath}/src`),
				})),
				'graphql-tag': join(rootDirectory, 'node_modules/graphql-tag/lib/index.js'),
				'graphql/execution/values': join(rootDirectory, 'node_modules/graphql/execution/values.js'),
				'graphql': join(rootDirectory, 'node_modules/graphql/index.js'),
				// '@graphql-tools/merge': join(rootDirectory, 'node_modules/@graphql-tools/merge/index.mjs'),
			},
		},
	}))
}

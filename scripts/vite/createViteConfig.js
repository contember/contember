import { defineConfig } from 'vitest/config'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const rootDirectory = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const packages = [
	'authorization',
	'cli',
	'cli-common',
	'config-loader',
	'create',
	'database',
	'database-migrations',
	'database-tester',
	'dic',
	'engine-api-tester',
	'engine-common',
	'engine-content-api',
	// 'engine-content-api-native',
	'engine-http',
	'engine-plugins',
	'engine-s3-plugin',
	'engine-server',
	'engine-system-api',
	'engine-tenant-api',
	'engine-vimeo-plugin',
	'graphql-utils',
	'queryable',
	'schema',
	'schema-definition',
	'schema-migrations',
	'schema-utils',
]
export  const createViteConfig = () => defineConfig({
	esbuild: {
		target: 'ES2019',
	},
	optimizeDeps: {
		exclude: ['@contember/engine-content-api-native']
	},
	resolve: {
		dedupe: ['graphql'],
		alias: {
			...Object.fromEntries(packages.map(packageName =>
				([`@contember/${packageName}`, join(rootDirectory, 'packages/' + packageName + '/src')])),
			),
			// '@contember/engine-content-api-native': join(rootDirectory, 'packages/engine-content-api-native/index.node'),
			'graphql-tag': join(rootDirectory, 'node_modules/graphql-tag/lib/index.js'),
			'graphql/execution/values': join(rootDirectory, 'node_modules/graphql/execution/values.js'),
			'graphql': join(rootDirectory, 'node_modules/graphql/index.js'),
			// '@graphql-tools/merge': join(rootDirectory, 'node_modules/@graphql-tools/merge/index.mjs'),
		},
	},

})

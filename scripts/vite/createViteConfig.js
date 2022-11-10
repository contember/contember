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
const eePackages = [
	'engine-actions',
	'engine-server-ee',
]
export  const createViteConfig = () => defineConfig({
	esbuild: {
		target: 'ES2019',
	},
	resolve: {
		dedupe: ['graphql'],
		alias: {
			...Object.fromEntries(packages.map(packageName =>
				([`@contember/${packageName}`, join(rootDirectory, 'packages/' + packageName + '/src')])),
			),
			...Object.fromEntries(eePackages.map(packageName =>
				([`@contember/${packageName}`, join(rootDirectory, 'ee/' + packageName + '/src')])),
			),
			'graphql-tag': join(rootDirectory, 'node_modules/graphql-tag/lib/index.js'),
			'graphql/execution/values': join(rootDirectory, 'node_modules/graphql/execution/values.js'),
			'graphql': join(rootDirectory, 'node_modules/graphql/index.js'),
			// '@graphql-tools/merge': join(rootDirectory, 'node_modules/@graphql-tools/merge/index.mjs'),
		},
	},
})

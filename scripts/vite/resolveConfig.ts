import { join } from "node:path";
// @ts-ignore
import { packages, rootDirectory } from "./packages";

export const resolveConfig = {
	dedupe: ['graphql'],
	alias: {
		...Object.fromEntries(Array.from(packages.entries()).map(([packageName, packagePath]) => [
			`@contember/${packageName}`,
			join(rootDirectory, `${packagePath}/src`),
		])),
		'graphql-tag': join(rootDirectory, 'node_modules/graphql-tag/lib/index.js'),
		'graphql/execution/values': join(rootDirectory, 'node_modules/graphql/execution/values.js'),
		'graphql': join(rootDirectory, 'node_modules/graphql/index.js'),
		// '@graphql-tools/merge': join(rootDirectory, 'node_modules/@graphql-tools/merge/index.mjs'),
	},
}


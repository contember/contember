import { AsyncGenerator } from 'graphql-ts-client-codegen'
import { makeExecutableSchema } from '@graphql-tools/schema'
// biome-ignore lint/correctness/useImportExtensions: .graphql files are resolved by the bundler loader, not as JS modules
import { schema as typeDefs } from '../../engine-actions/src/graphql/schema/actions.graphql'
import * as path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
const generator = new AsyncGenerator({
	schemaLoader: async () => {
		return makeExecutableSchema({
			typeDefs: typeDefs,
		})
	},
	targetDir: path.join(dirname(fileURLToPath(import.meta.url)), '../src/generated'),
	scalarTypeMap: {
		Json: 'unknown',
		UUID: 'string',
	},
})
generator.generate()

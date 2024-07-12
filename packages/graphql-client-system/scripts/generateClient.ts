import { AsyncGenerator } from 'graphql-ts-client-codegen'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { default as typeDefs } from '../../engine-system-api/src/schema/system.graphql'
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
		PrimaryKey: 'number | string',
	},
})
generator.generate()

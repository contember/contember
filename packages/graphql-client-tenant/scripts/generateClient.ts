import { AsyncGenerator } from 'graphql-ts-client-codegen'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '@contember/engine-tenant-api'
import * as path from 'path'

const generator = new AsyncGenerator({
	schemaLoader: async () => {
		return makeExecutableSchema({
			typeDefs: typeDefs,
		})
	},
	targetDir: path.join(__dirname, '../src/generated'),
	scalarTypeMap: {
		Json: 'unknown',
	},
})
generator.generate()

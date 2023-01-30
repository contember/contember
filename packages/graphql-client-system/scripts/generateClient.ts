import { AsyncGenerator } from 'graphql-ts-client-codegen'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '@contember/engine-system-api'
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
		PrimaryKey: 'number | string',
	},
})
generator.generate()

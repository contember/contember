import { AsyncGenerator } from 'graphql-ts-client-codegen'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { default as typeDefs } from '../../engine-tenant-api/src/schema/tenant.graphql'
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

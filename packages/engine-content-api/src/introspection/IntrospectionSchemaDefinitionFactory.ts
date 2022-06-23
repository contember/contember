import { IExecutableSchemaDefinition } from '@graphql-tools/schema'
import schema from './content-schema.graphql.js'
import * as ContentSchema from './content-schema.types.js'
import { IntrospectionSchemaFactory } from './IntrospectionSchemaFactory.js'

export class IntrospectionSchemaDefinitionFactory {
	constructor(private readonly introspectionSchemaFactory: IntrospectionSchemaFactory) {}

	public create(): IExecutableSchemaDefinition {
		return {
			typeDefs: schema,
			resolvers: {
				Query: {
					schema: (): ContentSchema._Schema => {
						return this.introspectionSchemaFactory.create()
					},
				},
			},
		}
	}
}

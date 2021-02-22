import { IExecutableSchemaDefinition } from 'graphql-tools'
import schema from './content-schema.graphql'
import * as ContentSchema from './content-schema.types'
import { IntrospectionSchemaFactory } from './IntrospectionSchemaFactory'

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

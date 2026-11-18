import { GraphQLSchema, GraphQLSchemaConfig } from 'graphql'
import * as ContentSchema from './content-schema.types.js'
import { IntrospectionSchemaFactory } from './IntrospectionSchemaFactory.js'
import { createSchemaConfig } from './introspection.schema.js'

export class IntrospectionSchemaDefinitionFactory {
	constructor(private readonly introspectionSchemaFactory: IntrospectionSchemaFactory) {}

	public create(): GraphQLSchema {
		return new GraphQLSchema(this.createConfig())
	}

	public createConfig(): GraphQLSchemaConfig {
		return createSchemaConfig((): ContentSchema._Schema => {
			return this.introspectionSchemaFactory.create()
		})
	}
}

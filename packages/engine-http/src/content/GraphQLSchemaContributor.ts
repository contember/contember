import { Schema } from '@contember/schema'
import { GraphQLSchema, GraphQLSchemaConfig } from 'graphql'
import { Identity } from './Identity'

export type GraphQLSchemaContributorContext = { schema: Schema; identity: Identity }

export interface GraphQLSchemaContributor {
	createSchema(context: GraphQLSchemaContributorContext): undefined | GraphQLSchema | GraphQLSchemaConfig
}

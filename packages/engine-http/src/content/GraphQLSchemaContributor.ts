import { Schema } from '@contember/schema'
import { GraphQLSchema, GraphQLSchemaConfig } from 'graphql'
import { Identity } from './Identity.js'
import { ProjectConfig } from '../project/config.js'

export type GraphQLSchemaContributorContext = {
	schema: Schema
	identity: Identity
	project: ProjectConfig
}

export interface GraphQLSchemaContributor {
	/**
	 * Must change whenever the output of createSchema can change, including everything it derives from the identity.
	 * The cache does not key the GraphQL schema by roles; role combinations with identical content permissions share it.
	 */
	getCacheKey?: (context: GraphQLSchemaContributorContext) => string
	createSchema(context: GraphQLSchemaContributorContext): undefined | GraphQLSchema | GraphQLSchemaConfig
}

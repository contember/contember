import { Schema } from '@contember/schema'
import { GraphQLSchema, GraphQLSchemaConfig } from 'graphql'
import { Identity } from './Identity'
import { ProjectConfig } from '../project/config'

export type GraphQLSchemaContributorContext = {
	schema: Schema
	identity: Identity
	project: ProjectConfig
}

export interface GraphQLSchemaContributor {
	getCacheKey?: (context: GraphQLSchemaContributorContext) => string
	createSchema(context: GraphQLSchemaContributorContext): undefined | GraphQLSchema | GraphQLSchemaConfig
}

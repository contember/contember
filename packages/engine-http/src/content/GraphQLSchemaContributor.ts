import { Schema } from '@contember/schema'
import { GraphQLSchema } from 'graphql'

export interface Identity {
	projectRoles: string[]
}

export type GraphQLSchemaContributorContext = { schema: Schema; identity: Identity }

export interface GraphQLSchemaContributor {
	createSchema(context: GraphQLSchemaContributorContext): undefined | GraphQLSchema

	getCacheKey(context: GraphQLSchemaContributorContext): string
}

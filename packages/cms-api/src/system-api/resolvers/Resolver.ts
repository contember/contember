import * as Schema from '../schema/types'
import { IResolvers } from 'graphql-tools'

export interface IgnoreIndex {
	[key: string]: any
}

export default interface Resolver extends IResolvers {
	Query: Schema.QueryResolvers.Resolvers & IgnoreIndex
	Mutation: Schema.MutationResolvers.Resolvers & IgnoreIndex
}

export type QueryResolver<T extends keyof Schema.QueryResolvers.Resolvers> = {
	[K in T]: Schema.QueryResolvers.Resolvers[K]
}
export type MutationResolver<T extends keyof Schema.MutationResolvers.Resolvers> = {
	[K in T]: Schema.MutationResolvers.Resolvers[K]
}

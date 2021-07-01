import * as Schema from '../schema'
import { IResolvers } from '@graphql-tools/utils'

export interface IgnoreIndex {
	[key: string]: any
}

export interface Resolver extends IResolvers {
	Query: Schema.QueryResolvers & IgnoreIndex
	Mutation: Schema.MutationResolvers & IgnoreIndex
}

export type QueryResolver<T extends keyof Schema.QueryResolvers> = { [K in T]: Schema.QueryResolvers[K] }
export type MutationResolver<T extends keyof Schema.MutationResolvers> = { [K in T]: Schema.MutationResolvers[K] }

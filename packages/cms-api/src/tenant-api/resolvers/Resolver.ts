import * as Schema from '../schema/types'
import { IResolvers } from 'graphql-tools'

export interface IgnoreIndex {
	[key: string]: any
}

export default interface Resolver extends IResolvers {
	Query: Schema.QueryResolvers.Resolvers & IgnoreIndex
	Mutation: Schema.MutationResolvers.Resolvers & IgnoreIndex
}

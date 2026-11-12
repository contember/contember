import * as Schema from '../schema/index.js'

export interface IgnoreIndex {
	[key: string]: any
}

export interface Resolver {
	Query: Schema.QueryResolvers & IgnoreIndex
	Mutation: Schema.MutationResolvers & IgnoreIndex
}

import * as Schema from '../schema'
import { IResolvers } from '@graphql-tools/utils'
import { ActionsContext } from './ActionsContext'
export interface IgnoreIndex {
	[key: string]: any
}
export interface Resolver extends IResolvers {
	Query: Schema.QueryResolvers<ActionsContext> & IgnoreIndex
	Mutation: Schema.MutationResolvers<ActionsContext> & IgnoreIndex
}
//# sourceMappingURL=Resolver.d.ts.map

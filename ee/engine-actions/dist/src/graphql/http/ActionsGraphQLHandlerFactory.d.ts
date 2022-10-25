import { GraphQLQueryHandler } from '@contember/engine-http'
import { ResolversFactory } from '../resolvers/ResolversFactory'
import { ActionsContext } from '../resolvers/ActionsContext'
export declare type ActionsGraphQLHandler = GraphQLQueryHandler<ActionsContext>
export declare class ActionsGraphQLHandlerFactory {
	create(resolversFactory: ResolversFactory): ActionsGraphQLHandler
}
//# sourceMappingURL=ActionsGraphQLHandlerFactory.d.ts.map

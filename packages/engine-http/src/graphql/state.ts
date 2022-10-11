import { GraphQLListener } from './execution'
import { KoaContext } from '../koa'

export const createGraphqlRequestInfoProviderListener = (): GraphQLListener<{
	koaContext: KoaContext<GraphQLKoaState>
}> => ({
	onExecute: ({ context, operation }) => {
		context.koaContext.state.graphql = {
			operationName: operation,
		}
	},
})

export type GraphQLKoaState = {
	graphql?: {
		operationName: string | undefined
	}
}

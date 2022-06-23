import { DocumentNode, OperationTypeNode } from 'graphql'
import { GraphQLListener } from './execution.js'
import { KoaContext } from '../koa/index.js'

const getOperationFromDocument = (document: DocumentNode): OperationTypeNode | undefined => {
	for (const node of document.definitions) {
		if (node.kind === 'OperationDefinition') {
			return node.operation
		}
	}
	return undefined
}

export const createGraphqlRequestInfoProviderListener = (): GraphQLListener<{
	koaContext: KoaContext<GraphQLKoaState>
}> => ({
	onExecute: ({ context, document }) => {
		context.koaContext.state.graphql = {
			operationName: getOperationFromDocument(document),
		}
	},
})

export type GraphQLKoaState = {
	graphql?: {
		operationName: string | undefined
	}
}

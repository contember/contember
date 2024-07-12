import { GraphQlFragmentSpread } from './GraphQlFragmentSpread'
import { GraphQlInlineFragment } from './GraphQlInlineFragment'
import { JSONValue } from '@contember/schema'

export class GraphQlField {
	constructor(
		public readonly alias: string | null,
		public readonly name: string,
		public readonly args: GraphQlFieldTypedArgs = {},
		public readonly selectionSet?: GraphQlSelectionSet,
	) {
	}
}

export type GraphQlFieldTypedArgs = Record<string, {
	graphQlType: string
	value?: JSONValue
}>

export type GraphQlSelectionSetItem = GraphQlField | GraphQlFragmentSpread | GraphQlInlineFragment

export type GraphQlSelectionSet = GraphQlSelectionSetItem[]

import { GraphQlFragmentSpread } from './GraphQlFragmentSpread.js'
import { GraphQlInlineFragment } from './GraphQlInlineFragment.js'
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

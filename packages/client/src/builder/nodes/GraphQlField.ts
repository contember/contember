import { JSONValue } from '../types/json'
import { GraphQlFragmentSpread } from './GraphQlFragmentSpread'
import { GraphQlInlineFragment } from './GraphQlInlineFragment'

/**
 * @internal
 */
export class GraphQlField {
	constructor(
		public readonly alias: string | null,
		public readonly name: string,
		public readonly args: GraphQlFieldTypedArgs = {},
		public readonly selectionSet?: GraphQlSelectionSet,
	) {
	}
}

/**
 * @internal
 */
export type GraphQlFieldTypedArgs = Record<string, {
	graphQlType: string
	value?: JSONValue
}>

/**
 * @internal
 */
export type GraphQlSelectionSetItem = GraphQlField | GraphQlFragmentSpread | GraphQlInlineFragment

export type GraphQlSelectionSet = GraphQlSelectionSetItem[]

import { GraphQlSelectionSet } from './GraphQlField'

/**
 * @internal
 */
export class GraphQlInlineFragment {
	constructor(
		public readonly type: string,
		public readonly selectionSet: GraphQlSelectionSet,
	) {
	}
}

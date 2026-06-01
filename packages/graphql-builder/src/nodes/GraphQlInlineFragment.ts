import { GraphQlSelectionSet } from './GraphQlField.js'

export class GraphQlInlineFragment {
	constructor(
		public readonly type: string,
		public readonly selectionSet: GraphQlSelectionSet,
	) {
	}
}

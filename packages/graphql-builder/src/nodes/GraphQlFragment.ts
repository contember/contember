import { GraphQlSelectionSet } from './GraphQlField.js'

export class GraphQlFragment {
	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly selectionSet: GraphQlSelectionSet,
	) {
	}
}

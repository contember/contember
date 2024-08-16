import { GraphQlSelectionSet } from './GraphQlField'

export class GraphQlFragment {
	constructor(
		public readonly name: string,
		public readonly type: string,
		public readonly selectionSet: GraphQlSelectionSet,
	) {
	}
}

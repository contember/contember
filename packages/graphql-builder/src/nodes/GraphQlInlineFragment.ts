import { GraphQlSelectionSet } from './GraphQlField'

export class GraphQlInlineFragment {
	constructor(
		public readonly type: string,
		public readonly selectionSet: GraphQlSelectionSet,
	) {
	}
}

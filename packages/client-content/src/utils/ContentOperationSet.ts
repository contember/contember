import { GraphQlSelectionSet } from '@contember/graphql-builder'

export class ContentOperationSet<TValue> {
	constructor(
		/** @internal */
		public readonly selection: GraphQlSelectionSet,
		/** @internal */
		public readonly parse: (value: any) => TValue = it => it as TValue,
	) {
	}
}

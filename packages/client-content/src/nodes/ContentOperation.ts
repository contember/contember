import { GraphQlFieldTypedArgs, GraphQlSelectionSet } from '@contember/graphql-builder'

export class ContentOperation<TValue, TType extends 'query' | 'mutation'> {
	/**
	 * @internal
	 */
	constructor(
		/** @internal */
		public readonly type: TType,
		/** @internal */
		public readonly fieldName: string,
		/** @internal */
		public readonly args: GraphQlFieldTypedArgs = {},
		/** @internal */
		public readonly selection?: GraphQlSelectionSet,
		/** @internal */
		public readonly parse: (value: any) => TValue = it => it as TValue,
	) {
	}
}

export type ContentQuery<TValue> = ContentOperation<TValue, 'query'>
export type ContentMutation<TValue> = ContentOperation<TValue, 'mutation'>

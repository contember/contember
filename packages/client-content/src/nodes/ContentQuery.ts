import { SchemaEntityNames } from '../types/Schema'
import { GraphQlFieldTypedArgs, GraphQlSelectionSet } from '@contember/graphql-builder'


export class ContentQuery<TValue> {
	public readonly type = 'query'

	/**
	 * @internal
	 */
	constructor(
		/** @internal */
		public readonly entity: SchemaEntityNames<string>,
		/** @internal */
		public readonly queryFieldName: string,
		/** @internal */
		public readonly args: GraphQlFieldTypedArgs = {},
		/** @internal */
		public readonly nodeSelection?: GraphQlSelectionSet,
		/** @internal */
		public readonly parse: (value: any) => TValue = it => it as TValue,
	) {
	}
}

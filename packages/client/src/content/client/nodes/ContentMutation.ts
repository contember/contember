import { SchemaEntityNames } from '../types'
import { GraphQlFieldTypedArgs, GraphQlSelectionSet } from '../../../builder'

export class ContentMutation<TValue> {
	public readonly type = 'mutation'

	/**
	 * @internal
	 */
	constructor(
		/** @internal */
		public readonly entity: SchemaEntityNames<string>,
		/** @internal */
		public readonly operation: 'create' | 'update' | 'delete' | 'upsert',
		/** @internal */
		public readonly mutationFieldName: string,
		/** @internal */
		public readonly mutationArgs: GraphQlFieldTypedArgs = {},
		/** @internal */
		public readonly nodeSelection?: GraphQlSelectionSet,
	) {
	}
}

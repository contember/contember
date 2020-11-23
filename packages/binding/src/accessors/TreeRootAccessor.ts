import { BindingOperations } from './BindingOperations'

// This allows us to have several parallel sub-trees without one having to be the main tree
// and all the other ones subordinate.
export class TreeRootAccessor {
	/**
	 * Whenever an update occurs, a new instance of this class is created.
	 */
	public constructor(
		public readonly hasUnpersistedChanges: boolean,
		public readonly isMutating: boolean,
		public readonly bindingOperations: BindingOperations,
	) {}

	public getAllTypeNames(): Set<string> {
		const typeNames = new Set<string>()
		const allEntities = this.bindingOperations.getAllEntities()

		for (const { typeName } of allEntities) {
			typeName && typeNames.add(typeName)
		}

		return typeNames
	}
}

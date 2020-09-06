import { TreeFilter } from '@contember/client'
import { EntityAccessor } from './EntityAccessor'
import { GetEntityByKey } from './GetEntityByKey'
import { GetSubTree } from './GetSubTree'

// This allows us to have several parallel sub-trees without one having to be the main tree
// and all the other ones subordinate.
class TreeRootAccessor {
	/**
	 * Whenever an update occurs, a new instance of this class is created.
	 * @param hasUnpersistedChanges
	 * @param addEventListener
	 * @param getEntityByKey Guaranteed to be referentially stable between updates.
	 * @param getSubTree Guaranteed to be referentially stable between updates.
	 * @param getAllEntities Guaranteed to be referentially stable between updates.
	 * @param unstable_getTreeFilters
	 */
	public constructor(
		public readonly hasUnpersistedChanges: boolean,
		public readonly addEventListener: TreeRootAccessor.AddTreeRootEventListener,
		public readonly getEntityByKey: GetEntityByKey,
		public readonly getSubTree: GetSubTree,
		public readonly getAllEntities: () => Generator<EntityAccessor>,
		public readonly unstable_getTreeFilters: () => TreeFilter[],
	) {}

	public getAllTypeNames(): Set<string> {
		const typeNames = new Set<string>()
		const allEntities = this.getAllEntities()

		for (const { typeName } of allEntities) {
			typeName && typeNames.add(typeName)
		}

		return typeNames
	}
}
namespace TreeRootAccessor {
	export interface TreeRootEventListenerMap {}
	export interface AddTreeRootEventListener {}
}

export { TreeRootAccessor }

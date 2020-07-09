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
	 * @param getAllTypeNames Guaranteed to be referentially stable between updates.
	 */
	public constructor(
		public readonly hasUnpersistedChanges: boolean,
		public readonly addEventListener: TreeRootAccessor.AddTreeRootEventListener,
		public readonly getEntityByKey: GetEntityByKey,
		public readonly getSubTree: GetSubTree,
		public readonly getAllEntities: () => Generator<EntityAccessor>,
		public readonly getAllTypeNames: () => Set<string>,
	) {}
}
namespace TreeRootAccessor {
	export type BeforePersistListener = (getTreeRoot: () => TreeRootAccessor) => void

	export interface TreeRootEventListenerMap {
		beforePersist: BeforePersistListener
	}
	export interface AddTreeRootEventListener {
		(type: 'beforePersist', listener: TreeRootEventListenerMap['beforePersist']): () => void
	}
}

export { TreeRootAccessor }

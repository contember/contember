import EntityAccessor from './EntityAccessor'
import EntityForRemovalAccessor from './EntityForRemovalAccessor'
import MarkerTreeRoot from './MarkerTreeRoot'
import { TreeId } from './TreeId'

export type RootAccessor =
	| (EntityAccessor | EntityForRemovalAccessor)
	| Array<EntityAccessor | EntityForRemovalAccessor | undefined> // Undefined is a "hole" after an non-persisted entity

export default class AccessorTreeRoot {
	public readonly id: TreeId

	private constructor(markerTreeRoot: MarkerTreeRoot, public readonly root: RootAccessor) {
		this.id = markerTreeRoot.id
	}

	public static createInstance(markerTreeRoot: MarkerTreeRoot, accessorRoot: RootAccessor): AccessorTreeRoot {
		return new AccessorTreeRoot(markerTreeRoot, accessorRoot)
	}
}

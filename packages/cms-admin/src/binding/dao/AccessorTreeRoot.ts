import EntityAccessor from './EntityAccessor'
import EntityCollectionAccessor from './EntityCollectionAccessor'
import EntityForRemovalAccessor from './EntityForRemovalAccessor'
import MarkerTreeRoot from './MarkerTreeRoot'
import { TreeId } from './TreeId'

export type RootAccessor = (EntityAccessor | EntityForRemovalAccessor) | EntityCollectionAccessor

export default class AccessorTreeRoot {
	public readonly id: TreeId

	private constructor(markerTreeRoot: MarkerTreeRoot, public readonly root: RootAccessor) {
		this.id = markerTreeRoot.id
	}

	public static createInstance(markerTreeRoot: MarkerTreeRoot, accessorRoot: RootAccessor): AccessorTreeRoot {
		return new AccessorTreeRoot(markerTreeRoot, accessorRoot)
	}
}

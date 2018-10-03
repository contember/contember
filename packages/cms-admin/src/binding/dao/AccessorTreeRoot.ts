import { EntityName } from '../bindingTypes'
import EntityAccessor from './EntityAccessor'
import EntityCollectionAccessor from './EntityCollectionAccessor'
import EntityForRemovalAccessor from './EntityForRemovalAccessor'
import MarkerTreeRoot from './MarkerTreeRoot'
import { TreeId } from './TreeId'

export type RootAccessor = (EntityAccessor | EntityForRemovalAccessor) | EntityCollectionAccessor

export default class AccessorTreeRoot {
	public readonly id: TreeId

	public constructor(
		markerTreeRoot: MarkerTreeRoot,
		public readonly root: RootAccessor,
		public readonly entityName: EntityName,
	) {
		this.id = markerTreeRoot.id
	}
}

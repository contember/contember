import { EntityName } from '../bindingTypes'
import { EntityAccessor } from './EntityAccessor'
import { EntityCollectionAccessor } from './EntityCollectionAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { MarkerTreeRoot } from './MarkerTreeRoot'

export type RootAccessor = (EntityAccessor | EntityForRemovalAccessor) | EntityCollectionAccessor

export class AccessorTreeRoot {
	public readonly id: MarkerTreeRoot.TreeId

	public constructor(
		markerTreeRoot: MarkerTreeRoot,
		public readonly root: RootAccessor,
		public readonly entityName: EntityName,
	) {
		this.id = markerTreeRoot.id
	}
}

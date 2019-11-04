import { EntityName } from '../bindingTypes'
import { EntityAccessor } from './EntityAccessor'
import { EntityListAccessor } from './EntityListAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { MarkerTreeRoot } from './MarkerTreeRoot'

export type RootAccessor = (EntityAccessor | EntityForRemovalAccessor) | EntityListAccessor

export class AccessorTreeRoot {
	public readonly id: MarkerTreeRoot.TreeId

	public constructor(
		markerTreeRoot: MarkerTreeRoot,
		public readonly root: RootAccessor,
		public readonly entityName: EntityName,
	) {
		this.id = markerTreeRoot.id
	}

	public map<T>(mapper: (accessor: EntityAccessor | EntityForRemovalAccessor | undefined) => T): T[] {
		return (this.root instanceof EntityListAccessor ? this.root.entities : [this.root]).map(mapper)
	}
}

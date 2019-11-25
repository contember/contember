import { MarkerTreeRoot } from '../markers'
import { EntityName } from '../treeParameters'
import { EntityAccessor } from './EntityAccessor'
import { EntityForRemovalAccessor } from './EntityForRemovalAccessor'
import { EntityListAccessor } from './EntityListAccessor'

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

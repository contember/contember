import type { ParentEntityParameters } from '../treeParameters'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import type { SubTreeMarkers } from './SubTreeMarkers'

export class EntityFieldsWithHoistablesMarker {
	public constructor(
		public readonly fields: EntityFieldMarkersContainer,
		public readonly subTrees: SubTreeMarkers | undefined,
		public readonly parentReference: ParentEntityParameters | undefined,
	) {}
}

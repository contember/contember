import type { ParentEntityParameters } from '../treeParameters/index.js'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer.js'
import type { SubTreeMarkers } from './SubTreeMarkers.js'

export class EntityFieldsWithHoistablesMarker {
	public constructor(
		public readonly fields: EntityFieldMarkersContainer,
		public readonly subTrees: SubTreeMarkers | undefined,
		public readonly parentReference: ParentEntityParameters | undefined,
	) {}
}

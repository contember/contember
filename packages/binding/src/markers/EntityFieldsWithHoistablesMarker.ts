import { ParentEntityParameters } from '../treeParameters'
import { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'
import { SubTreeMarkers } from './SubTreeMarkers'

export class EntityFieldsWithHoistablesMarker {
	public constructor(
		public readonly fields: EntityFieldMarkersContainer,
		public readonly subTrees: SubTreeMarkers | undefined,
		public readonly parentReference: ParentEntityParameters | undefined,
	) {}
}

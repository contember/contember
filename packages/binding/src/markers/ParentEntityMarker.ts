import type { ParentEntityParameters } from '../treeParameters'
import type { EntityFieldMarkersContainer } from './EntityFieldMarkersContainer'

export class ParentEntityMarker {
	public constructor(
		public readonly parentEntity: ParentEntityParameters,
		public readonly fields: EntityFieldMarkersContainer,
	) {}
}

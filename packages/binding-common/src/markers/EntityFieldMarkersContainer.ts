import type { EntityFieldMarkers } from './EntityFieldMarkers'
import type { EntityFieldPlaceholders } from './EntityFieldPlaceholders'

export class EntityFieldMarkersContainer {
	public constructor(
		public readonly hasAtLeastOneBearingField: boolean,
		public readonly markers: EntityFieldMarkers, // Indexed by placeholder names
		public readonly placeholders: EntityFieldPlaceholders, // Indexed by field names
	) {}
}

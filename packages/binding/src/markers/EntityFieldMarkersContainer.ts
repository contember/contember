import { assertNever } from '../utils'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { EntityFieldPlaceholders } from './EntityFieldPlaceholders'
import { FieldMarker } from './FieldMarker'
import { HasManyRelationMarker } from './HasManyRelationMarker'
import { HasOneRelationMarker } from './HasOneRelationMarker'
import { SubTreeMarker } from './SubTreeMarker'

class EntityFieldMarkersContainer {
	public constructor(
		public readonly hasAtLeastOneBearingField: boolean,
		public readonly markers: EntityFieldMarkers, // Indexed by placeholder names
		public readonly placeholders: EntityFieldPlaceholders, // Indexed by field names
	) {
		this.hasAtLeastOneBearingField = EntityFieldMarkersContainer.hasAtLeastOneBearingField(markers)
	}
}

namespace EntityFieldMarkersContainer {
	export const hasAtLeastOneBearingField = (fields: EntityFieldMarkers): boolean => {
		for (const [, marker] of fields) {
			if (marker instanceof FieldMarker) {
				if (!marker.isNonbearing) {
					return true
				}
			} else if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
				if (marker.fields.hasAtLeastOneBearingField) {
					return true
				}
			} else if (marker instanceof SubTreeMarker) {
				// Exclude it from the decision as it will be hoisted.
			} else {
				assertNever(marker)
			}
		}
		return false
	}
}

export { EntityFieldMarkersContainer }

import { BindingError } from '../BindingError'
import type { FieldName, PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import type { EntityFieldMarkers } from './EntityFieldMarkers'
import type { EntityFieldPlaceholders } from './EntityFieldPlaceholders'
import { FieldMarker } from './FieldMarker'
import { HasManyRelationMarker } from './HasManyRelationMarker'
import { HasOneRelationMarker } from './HasOneRelationMarker'

export class EntityFieldMarkersContainer {
	public constructor(
		public readonly hasAtLeastOneBearingField: boolean,
		public readonly markers: EntityFieldMarkers, // Indexed by placeholder names
		public readonly placeholders: EntityFieldPlaceholders, // Indexed by field names
	) {}

	// …asserting that it's present
	public getFieldByPlaceholder(placeholder: PlaceholderName): FieldName {
		const marker = this.markers.get(placeholder)

		if (marker instanceof FieldMarker) {
			return marker.fieldName
		}
		if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
			return marker.parameters.field
		}
		if (marker === undefined) {
			throw new BindingError()
		}
		return assertNever(marker)
	}

	public *getPlaceholdersByField(field: FieldName): IterableIterator<PlaceholderName> {
		const placeholders = this.placeholders.get(field)

		if (placeholders === undefined) {
			return
		}
		if (typeof placeholders === 'string') {
			yield placeholders
			return
		}
		yield* placeholders.values()
	}
}

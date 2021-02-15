import { BindingError } from '../BindingError'
import { FieldName, PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import { EntityFieldMarkers } from './EntityFieldMarkers'
import { EntityFieldPlaceholders } from './EntityFieldPlaceholders'
import { EntityListSubTreeMarker } from './EntityListSubTreeMarker'
import { EntitySubTreeMarker } from './EntitySubTreeMarker'
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
		if (marker === undefined || marker instanceof EntitySubTreeMarker || marker instanceof EntityListSubTreeMarker) {
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

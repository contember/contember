import { assertNever } from '../utils'
import { ConnectionMarker } from './ConnectionMarker'
import { FieldMarker } from './FieldMarker'
import { Marker } from './Marker'
import { ReferenceMarker } from './ReferenceMarker'
import { SubTreeMarker } from './SubTreeMarker'

export type EntityFieldMarkers = Map<string, Marker>

export const hasAtLeastOneBearingField = (fields: EntityFieldMarkers): boolean => {
	for (const [, marker] of fields) {
		if (marker instanceof FieldMarker) {
			if (!marker.isNonbearing) {
				return true
			}
		} else if (marker instanceof ReferenceMarker) {
			if (marker.hasAtLeastOneBearingField) {
				return true
			}
		} else if (marker instanceof ConnectionMarker) {
			if (!marker.isNonbearing) {
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
